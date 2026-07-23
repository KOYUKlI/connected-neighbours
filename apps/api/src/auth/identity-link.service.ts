import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';

import { AuthenticationProvider } from './authenticated-identity.type';
import type { AuthenticatedUser } from './authenticated-user.type';
import type { KeycloakTokenPayload } from './keycloak-token-verifier.service';
import {
  IdentityLinkRequest,
  IdentityLinkRequestDocument,
  IdentityLinkRequestStatus,
} from './schemas/identity-link-request.schema';
import {
  SecurityEventResult,
  SecurityEventType,
} from './schemas/security-audit-event.schema';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';

const LINK_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class IdentityLinkService {
  constructor(
    @InjectModel(IdentityLinkRequest.name)
    private readonly linkRequestModel: Model<IdentityLinkRequestDocument>,
    private readonly usersService: UsersService,
    private readonly auditService: SecurityAuditService,
  ) {}

  async requestLink(user: AuthenticatedUser) {
    if (user.identity?.provider !== AuthenticationProvider.LOCAL) {
      throw new ForbiddenException(
        'La liaison doit être demandée depuis une session locale.',
      );
    }

    await this.linkRequestModel.updateMany(
      { userId: user.sub, status: IdentityLinkRequestStatus.ACTIVE },
      { $set: { status: IdentityLinkRequestStatus.EXPIRED } },
    );

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + LINK_TTL_MS);

    await this.linkRequestModel.create({
      userId: user.sub,
      provider: 'keycloak',
      tokenHash: this.hashToken(token),
      expiresAt,
      usedAt: null,
      status: IdentityLinkRequestStatus.ACTIVE,
      requestedBy: user.sub,
    });

    await this.auditService.record({
      userId: user.sub,
      provider: 'local',
      eventType: SecurityEventType.IDENTITY_LINK_REQUESTED,
      result: SecurityEventResult.SUCCESS,
    });

    return { linkToken: token, expiresAt };
  }

  async completeLink(linkToken: string, keycloakPayload: KeycloakTokenPayload) {
    if (
      !keycloakPayload.sub ||
      !keycloakPayload.email ||
      keycloakPayload.email_verified !== true
    ) {
      throw new BadRequestException(
        'Une adresse e-mail Keycloak vérifiée est requise.',
      );
    }

    const tokenHash = this.hashToken(linkToken);
    const request = await this.linkRequestModel
      .findOne({
        tokenHash,
        status: IdentityLinkRequestStatus.ACTIVE,
      })
      .select('+tokenHash')
      .exec();

    if (
      !request ||
      request.expiresAt.getTime() <= Date.now() ||
      !this.safeEquals(request.tokenHash, tokenHash)
    ) {
      throw new BadRequestException(
        'La demande de liaison est invalide ou expirée.',
      );
    }

    const user = await this.usersService.findIdentityById(request.userId);
    const normalizedEmail = keycloakPayload.email.trim().toLowerCase();

    if (
      !user ||
      !user.isActive ||
      !user.passwordHash ||
      user.email !== normalizedEmail
    ) {
      await this.failRequest(request);
      throw new ConflictException(
        'Cette identité ne peut pas être liée automatiquement.',
      );
    }

    const subjectOwner = await this.usersService.findByKeycloakSubject(
      keycloakPayload.sub,
    );
    if (subjectOwner && subjectOwner.id !== user.id) {
      await this.failRequest(request);
      throw new ConflictException(
        'Cette identité Keycloak est déjà associée à un autre compte.',
      );
    }

    const linked = await this.usersService.linkKeycloakIdentity({
      userId: user.id,
      keycloakSubject: keycloakPayload.sub,
      emailVerified: true,
    });

    if (!linked) {
      await this.failRequest(request);
      throw new ConflictException(
        'Le compte a été modifié pendant la liaison. Recommencez la procédure.',
      );
    }

    request.status = IdentityLinkRequestStatus.USED;
    request.usedAt = new Date();
    await request.save();

    await this.auditService.record({
      userId: user.id,
      provider: 'keycloak',
      eventType: SecurityEventType.IDENTITY_LINKED,
      result: SecurityEventResult.SUCCESS,
    });

    return {
      linked: true,
      user: this.usersService.toPublicUser(linked),
    };
  }

  private async failRequest(request: IdentityLinkRequestDocument) {
    request.status = IdentityLinkRequestStatus.FAILED;
    request.usedAt = new Date();
    await request.save();

    await this.auditService.record({
      userId: request.userId,
      provider: 'keycloak',
      eventType: SecurityEventType.IDENTITY_LINK_FAILED,
      result: SecurityEventResult.FAILURE,
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private safeEquals(first: string, second: string) {
    const firstBuffer = Buffer.from(first);
    const secondBuffer = Buffer.from(second);

    return (
      firstBuffer.length === secondBuffer.length &&
      timingSafeEqual(firstBuffer, secondBuffer)
    );
  }
}
