import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from './authenticated-user.type';
import { CurrentUser } from './current-user.decorator';
import { AdminListIdentitiesQueryDto } from './dto/admin-list-identities-query.dto';
import { RequestAccountActionDto } from './dto/request-account-action.dto';
import { RevokeIdentitySessionsDto } from './dto/revoke-identity-sessions.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { KeycloakAdminService } from './keycloak-admin.service';
import { MfaGuard } from './mfa.guard';
import { RequireMfa } from './require-mfa.decorator';
import { Role } from './role.enum';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import {
  SecurityEventResult,
  SecurityEventType,
} from './schemas/security-audit-event.schema';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';

@ApiTags('admin identities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/identities')
export class AdminIdentitiesController {
  constructor(
    private readonly usersService: UsersService,
    private readonly keycloakAdmin: KeycloakAdminService,
    private readonly auditService: SecurityAuditService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les identités MongoDB sans secret ni sujet Keycloak',
  })
  list(@Query() query: AdminListIdentitiesQueryDto) {
    return this.usersService.listIdentitySummaries(query);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Consulter le statut de sécurité limité d’une identité',
  })
  async getOne(@Param('userId') userId: string) {
    const identity = await this.usersService.getIdentitySummary(userId);
    if (!identity.keycloakLinked) {
      return { identity, keycloak: null };
    }

    const subject = await this.usersService.getKeycloakSubject(userId);
    const keycloak = subject
      ? await this.keycloakAdmin.getUserSecurity(subject)
      : null;
    return { identity, keycloak };
  }

  @Post(':userId/actions')
  @RequireMfa()
  @UseGuards(MfaGuard)
  @ApiOperation({
    summary: 'Envoyer une action de sécurité Keycloak à un utilisateur',
  })
  @ApiForbiddenResponse({ description: 'MFA ou rôle administrateur absent.' })
  @ApiConflictResponse({ description: 'Compte non lié à Keycloak.' })
  async sendAction(
    @Param('userId') userId: string,
    @Body() dto: RequestAccountActionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const subject = await this.usersService.requireKeycloakSubject(userId);
    await this.keycloakAdmin.sendRequiredActionEmail(subject, dto.action);
    await this.auditService.record({
      userId,
      provider: 'keycloak',
      eventType: SecurityEventType.ADMIN_ACCOUNT_ACTION_REQUESTED,
      result: SecurityEventResult.SUCCESS,
      context: { actorId: actor.sub, action: dto.action },
    });
    return { sent: true };
  }

  @Post(':userId/revoke')
  @RequireMfa()
  @UseGuards(MfaGuard)
  @ApiOperation({
    summary: 'Révoquer toutes les sessions Keycloak d’un utilisateur',
  })
  @ApiForbiddenResponse({ description: 'MFA ou rôle administrateur absent.' })
  @ApiConflictResponse({ description: 'Compte non lié à Keycloak.' })
  async revoke(
    @Param('userId') userId: string,
    @Body() dto: RevokeIdentitySessionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const subject = await this.usersService.requireKeycloakSubject(userId);
    await this.keycloakAdmin.logoutAll(subject);
    await this.auditService.record({
      userId,
      provider: 'keycloak',
      eventType: SecurityEventType.ADMIN_SESSION_REVOKED,
      result: SecurityEventResult.SUCCESS,
      context: { actorId: actor.sub, reason: dto.reason },
    });
    return { revoked: true };
  }
}
