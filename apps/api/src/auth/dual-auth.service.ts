import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';

import {
  IdentityResolutionService,
  type LocalTokenPayload,
} from './identity-resolution.service';
import {
  BearerTokenKind,
  KeycloakTokenVerifier,
} from './keycloak-token-verifier.service';

@Injectable()
export class DualAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly keycloakVerifier: KeycloakTokenVerifier,
    private readonly identityResolution: IdentityResolutionService,
  ) {}

  async authenticate(token: string) {
    const kind = this.keycloakVerifier.classify(token);

    if (kind === BearerTokenKind.KEYCLOAK) {
      const payload = await this.keycloakVerifier.verify(token);
      return this.identityResolution.resolveKeycloak(payload);
    }

    if (!this.configService.get<boolean>('AUTH_LOCAL_ENABLED', true)) {
      throw new UnauthorizedException('Authentification locale désactivée');
    }

    try {
      const payload = await this.jwtService.verifyAsync<LocalTokenPayload>(
        token,
        {
          algorithms: ['HS256'],
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      if (
        payload.iss ||
        !payload.sub ||
        !Types.ObjectId.isValid(payload.sub) ||
        !payload.iat ||
        !payload.exp
      ) {
        throw new UnauthorizedException('Jeton local invalide');
      }

      return this.identityResolution.resolveLocal(payload);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Jeton local invalide ou expiré');
    }
  }
}
