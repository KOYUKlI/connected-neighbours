import { Injectable, UnauthorizedException } from '@nestjs/common';

import {
  AuthenticatedIdentity,
  AuthenticationProvider,
} from './authenticated-identity.type';
import type { AuthenticatedUser } from './authenticated-user.type';
import type { KeycloakTokenPayload } from './keycloak-token-verifier.service';
import { Role } from './role.enum';
import {
  SecurityEventResult,
  SecurityEventType,
} from './schemas/security-audit-event.schema';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';
import { IdentityLinkRequiredException } from './identity-link-required.exception';

export type LocalTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  displayName: string;
  neighborhoodId: string;
  iat: number;
  exp: number;
  iss?: never;
};

@Injectable()
export class IdentityResolutionService {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: SecurityAuditService,
  ) {}

  async resolveLocal(payload: LocalTokenPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      if (user) {
        await this.auditService.record({
          userId: user.id,
          provider: 'local',
          eventType: SecurityEventType.ACCOUNT_DISABLED_REJECTION,
          result: SecurityEventResult.DENIED,
        });
      }

      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }

    return this.toAuthenticatedUser(user, {
      provider: AuthenticationProvider.LOCAL,
      internalUserId: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      tokenIssuedAt: new Date(payload.iat * 1000),
      tokenExpiresAt: new Date(payload.exp * 1000),
      authenticationMethods: ['password'],
      mfaSatisfied: false,
      role: user.role,
      neighborhoodId: user.neighborhoodId,
      displayName: user.displayName,
    });
  }

  async resolveKeycloak(payload: KeycloakTokenPayload) {
    if (
      !payload.sub ||
      !payload.iat ||
      !payload.exp ||
      payload.email_verified !== true ||
      !payload.email
    ) {
      throw new UnauthorizedException(
        'L’identité Keycloak doit disposer d’une adresse e-mail vérifiée.',
      );
    }

    let user = await this.usersService.findByKeycloakSubject(payload.sub);

    if (!user) {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const existing =
        await this.usersService.findIdentityByEmail(normalizedEmail);

      if (existing) {
        await this.usersService.markIdentityLinkRequired(existing.id);
        throw new IdentityLinkRequiredException();
      }

      user = await this.usersService.createKeycloakUser({
        keycloakSubject: payload.sub,
        email: normalizedEmail,
        displayName: this.resolveDisplayName(payload),
      });

      await this.auditService.record({
        userId: user.id,
        provider: 'keycloak',
        eventType: SecurityEventType.IDENTITY_PROVISIONED,
        result: SecurityEventResult.SUCCESS,
      });
    }

    if (!user.isActive) {
      await this.auditService.record({
        userId: user.id,
        provider: 'keycloak',
        eventType: SecurityEventType.ACCOUNT_DISABLED_REJECTION,
        result: SecurityEventResult.DENIED,
      });
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }

    await this.usersService.touchIdentitySync(user.id, payload.email_verified);

    const authenticationMethods = Array.isArray(payload.amr)
      ? payload.amr.filter(
          (method): method is string => typeof method === 'string',
        )
      : [];

    const identity: AuthenticatedIdentity = {
      provider: AuthenticationProvider.KEYCLOAK,
      internalUserId: user.id,
      externalSubject: payload.sub,
      email: user.email,
      emailVerified: payload.email_verified,
      tokenIssuedAt: new Date(payload.iat * 1000),
      tokenExpiresAt: new Date(payload.exp * 1000),
      sessionId: payload.sid ?? payload.session_state,
      authenticationMethods,
      mfaSatisfied: this.hasMfa(
        authenticationMethods,
        payload.acr,
        payload.cn_mfa,
      ),
      role: user.role,
      neighborhoodId: user.neighborhoodId,
      displayName: user.displayName,
    };

    return this.toAuthenticatedUser(user, identity);
  }

  private toAuthenticatedUser(
    user: {
      id: string;
      email: string;
      role: Role;
      displayName: string;
      neighborhoodId: string;
    },
    identity: AuthenticatedIdentity,
  ): AuthenticatedUser {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      neighborhoodId: user.neighborhoodId,
      identity,
    };
  }

  private resolveDisplayName(payload: KeycloakTokenPayload) {
    const value =
      payload.name ??
      payload.preferred_username ??
      payload.email?.split('@')[0] ??
      'Nouveau voisin';

    return value.trim().slice(0, 120);
  }

  private hasMfa(methods: string[], acr?: string, signedMfaClaim?: boolean) {
    if (signedMfaClaim === true) return true;
    if (methods.some((method) => /otp|totp|mfa/i.test(method))) return true;

    const numericAcr = Number(acr);
    return Number.isFinite(numericAcr) && numericAcr >= 2;
  }
}
