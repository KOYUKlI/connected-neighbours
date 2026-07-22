import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import {
  SecurityEventResult,
  SecurityEventType,
} from './schemas/security-audit-event.schema';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: SecurityAuditService,
  ) {}

  async login(dto: LoginDto) {
    if (!this.configService.get<boolean>('AUTH_LOCAL_ENABLED', true)) {
      throw new UnauthorizedException('Authentification locale désactivée');
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive || !user.passwordHash) {
      await this.recordAudit({
        userId: user?.id,
        eventType: SecurityEventType.LOGIN_LOCAL_FAILURE,
        result: SecurityEventResult.FAILURE,
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordOk = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordOk) {
      await this.recordAudit({
        userId: user.id,
        eventType: SecurityEventType.LOGIN_LOCAL_FAILURE,
        result: SecurityEventResult.FAILURE,
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      neighborhoodId: user.neighborhoodId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.recordAudit({
      userId: user.id,
      eventType: SecurityEventType.LOGIN_LOCAL_SUCCESS,
      result: SecurityEventResult.SUCCESS,
    });

    return {
      accessToken,
      user: this.usersService.toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }

    return this.usersService.toPublicUser(user);
  }

  async neighbours(userId: string, neighborhoodId: string) {
    const users = await this.usersService.findByNeighborhood(
      neighborhoodId,
      userId,
    );

    return users.map((user) => this.usersService.toPublicUser(user));
  }

  private async recordAudit(input: {
    userId?: string;
    eventType: SecurityEventType;
    result: SecurityEventResult;
  }) {
    try {
      await this.auditService.record({
        ...input,
        provider: 'local',
      });
    } catch {
      // Authentication must not fail because the auxiliary audit store is unavailable.
    }
  }
}
