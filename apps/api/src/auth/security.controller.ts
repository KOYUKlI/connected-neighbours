import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from './authenticated-user.type';
import { CurrentUser } from './current-user.decorator';
import {
  AccountSecurityAction,
  RequestAccountActionDto,
} from './dto/request-account-action.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  KeycloakAdminService,
  type KeycloakAvailability,
} from './keycloak-admin.service';
import { MfaGuard } from './mfa.guard';
import { RequireMfa } from './require-mfa.decorator';
import {
  SecurityEventResult,
  SecurityEventType,
} from './schemas/security-audit-event.schema';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';

@ApiTags('account security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/security')
export class SecurityController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: SecurityAuditService,
    private readonly configService: ConfigService,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consulter la sécurité de mon identité' })
  async getSecurity(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.sub);
    const publicUrl = this.configService
      .get<string>('KEYCLOAK_PUBLIC_URL', '')
      .replace(/\/+$/, '');
    const realm = this.configService.get<string>(
      'KEYCLOAK_REALM',
      'connected-neighbours',
    );
    const liveSecurity = user?.keycloakSubject
      ? await this.getLiveSecurity(user.keycloakSubject)
      : null;

    return {
      identityProvider: user?.identityProvider ?? 'local',
      emailVerified:
        liveSecurity?.emailVerified ?? user?.emailVerified ?? false,
      identityLinked: Boolean(user?.keycloakSubject),
      identityLinkedAt: user?.identityLinkedAt ?? null,
      onboardingCompleted: user?.onboardingCompleted ?? true,
      keycloakEnabled: this.configService.get<boolean>(
        'KEYCLOAK_ENABLED',
        false,
      ),
      keycloakAvailability:
        liveSecurity?.availability ?? this.keycloakAdmin.availability(),
      mfaConfigured: liveSecurity?.mfaConfigured ?? null,
      sessionCount: liveSecurity?.sessionCount ?? null,
      accountConsoleUrl: publicUrl
        ? `${publicUrl}/realms/${realm}/account`
        : null,
      session: {
        provider: currentUser.identity?.provider ?? 'local',
        mfaSatisfied: currentUser.identity?.mfaSatisfied ?? false,
        authenticationMethods: currentUser.identity?.authenticationMethods ?? [
          'password',
        ],
        expiresAt: currentUser.identity?.tokenExpiresAt ?? null,
      },
    };
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Lister mes sessions Keycloak sans identifiant exploitable',
  })
  @ApiConflictResponse({ description: 'Compte non lié à Keycloak.' })
  async getSessions(@CurrentUser() currentUser: AuthenticatedUser) {
    const subject = await this.usersService.requireKeycloakSubject(
      currentUser.sub,
    );
    return this.keycloakAdmin.listSessions(subject);
  }

  @Post('actions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Demander un e-mail de vérification, mot de passe ou MFA',
  })
  @ApiConflictResponse({ description: 'Compte non lié à Keycloak.' })
  async requestAction(
    @Body() dto: RequestAccountActionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const subject = await this.usersService.requireKeycloakSubject(
      currentUser.sub,
    );
    await this.keycloakAdmin.sendRequiredActionEmail(subject, dto.action);
    await this.auditService.record({
      userId: currentUser.sub,
      provider: 'keycloak',
      eventType: this.eventForAction(dto.action),
      result: SecurityEventResult.SUCCESS,
      context: { action: dto.action },
    });
    return { sent: true };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Journaliser la déconnexion courante' })
  async recordLogout(@CurrentUser() currentUser: AuthenticatedUser) {
    await this.auditService.record({
      userId: currentUser.sub,
      provider: currentUser.identity?.provider ?? 'local',
      eventType: SecurityEventType.LOGOUT,
      result: SecurityEventResult.SUCCESS,
    });
  }

  @Post('logout-all')
  @RequireMfa()
  @UseGuards(MfaGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Révoquer toutes mes sessions Keycloak' })
  @ApiForbiddenResponse({ description: 'MFA requise.' })
  @ApiConflictResponse({ description: 'Compte non lié à Keycloak.' })
  async logoutAll(@CurrentUser() currentUser: AuthenticatedUser) {
    const subject = await this.usersService.requireKeycloakSubject(
      currentUser.sub,
    );
    await this.keycloakAdmin.logoutAll(subject);
    await this.auditService.record({
      userId: currentUser.sub,
      provider: 'keycloak',
      eventType: SecurityEventType.LOGOUT_ALL,
      result: SecurityEventResult.SUCCESS,
    });
    return { revoked: true };
  }

  @Get('events')
  @ApiOperation({ summary: 'Consulter mon journal de sécurité' })
  getEvents(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.auditService.listForUser(currentUser.sub);
  }

  private async getLiveSecurity(subject: string): Promise<{
    availability: KeycloakAvailability;
    emailVerified: boolean | null;
    mfaConfigured: boolean | null;
    sessionCount: number | null;
  }> {
    try {
      return await this.keycloakAdmin.getUserSecurity(subject);
    } catch {
      return {
        availability:
          this.keycloakAdmin.availability() === 'disabled'
            ? 'disabled'
            : 'unavailable',
        emailVerified: null,
        mfaConfigured: null,
        sessionCount: null,
      };
    }
  }

  private eventForAction(action: AccountSecurityAction) {
    const events = {
      [AccountSecurityAction.VERIFY_EMAIL]:
        SecurityEventType.EMAIL_VERIFICATION_REQUESTED,
      [AccountSecurityAction.UPDATE_PASSWORD]:
        SecurityEventType.PASSWORD_CHANGE_REQUESTED,
      [AccountSecurityAction.CONFIGURE_TOTP]:
        SecurityEventType.MFA_SETUP_REQUESTED,
    };
    return events[action];
  }
}
