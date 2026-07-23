import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';

import { AdminIdentitiesController } from './admin-identities.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DualAuthService } from './dual-auth.service';
import { IdentityController } from './identity.controller';
import { IdentityLinkService } from './identity-link.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { KeycloakAdminService } from './keycloak-admin.service';
import { MfaGuard } from './mfa.guard';
import { KeycloakTokenVerifier } from './keycloak-token-verifier.service';
import { PasswordService } from './password.service';
import {
  IdentityLinkRequest,
  IdentityLinkRequestSchema,
} from './schemas/identity-link-request.schema';
import {
  SecurityAuditEvent,
  SecurityAuditEventSchema,
} from './schemas/security-audit-event.schema';
import { User, UserSchema } from './schemas/user.schema';
import { SecurityAuditService } from './security-audit.service';
import { SecurityController } from './security.controller';
import { UsersService } from './users.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>(
          'JWT_EXPIRES_IN',
          '1d',
        ) as SignOptions['expiresIn'];

        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            algorithm: 'HS256',
            expiresIn,
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: IdentityLinkRequest.name,
        schema: IdentityLinkRequestSchema,
      },
      {
        name: SecurityAuditEvent.name,
        schema: SecurityAuditEventSchema,
      },
    ]),
  ],
  controllers: [
    AdminIdentitiesController,
    AuthController,
    IdentityController,
    SecurityController,
  ],
  providers: [
    AuthService,
    UsersService,
    PasswordService,
    JwtStrategy,
    JwtAuthGuard,
    DualAuthService,
    KeycloakTokenVerifier,
    KeycloakAdminService,
    IdentityResolutionService,
    IdentityLinkService,
    SecurityAuditService,
    MfaGuard,
  ],
  exports: [
    AuthService,
    UsersService,
    JwtModule,
    JwtAuthGuard,
    DualAuthService,
    KeycloakTokenVerifier,
    KeycloakAdminService,
    SecurityAuditService,
    MfaGuard,
  ],
})
export class AuthModule {}
