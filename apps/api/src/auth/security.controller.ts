import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from './authenticated-user.type';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
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

    return {
      identityProvider: user?.identityProvider ?? 'local',
      emailVerified: user?.emailVerified ?? false,
      identityLinked: Boolean(user?.keycloakSubject),
      identityLinkedAt: user?.identityLinkedAt ?? null,
      onboardingCompleted: user?.onboardingCompleted ?? true,
      keycloakEnabled: this.configService.get<boolean>(
        'KEYCLOAK_ENABLED',
        false,
      ),
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

  @Get('events')
  @ApiOperation({ summary: 'Consulter mon journal de sécurité' })
  getEvents(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.auditService.listForUser(currentUser.sub);
  }
}
