import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type KeycloakTokenPayload = JWTPayload & {
  azp?: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  name?: string;
  amr?: string[];
  acr?: string;
  sid?: string;
  session_state?: string;
  cn_mfa?: boolean;
};

type RemoteJwkSet = ReturnType<typeof createRemoteJWKSet>;

export enum BearerTokenKind {
  LOCAL = 'local',
  KEYCLOAK = 'keycloak',
}

@Injectable()
export class KeycloakTokenVerifier {
  private readonly enabled: boolean;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwksUrl: URL | null;
  private readonly timeoutDuration: number;
  private readonly allowedAuthorizedParties: Set<string>;
  private jwks: RemoteJwkSet | null = null;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('KEYCLOAK_ENABLED', false);
    const publicUrl = this.trimTrailingSlash(
      this.configService.get<string>('KEYCLOAK_PUBLIC_URL', ''),
    );
    const internalUrl = this.trimTrailingSlash(
      this.configService.get<string>('KEYCLOAK_INTERNAL_URL', ''),
    );
    const realm = this.configService.get<string>(
      'KEYCLOAK_REALM',
      'connected-neighbours',
    );

    this.issuer = publicUrl ? `${publicUrl}/realms/${realm}` : '';
    this.audience = this.configService.get<string>(
      'KEYCLOAK_API_AUDIENCE',
      'connected-neighbours-api',
    );
    this.timeoutDuration = this.configService.get<number>(
      'KEYCLOAK_REQUEST_TIMEOUT_MS',
      2500,
    );
    this.allowedAuthorizedParties = new Set([
      this.configService.get<string>(
        'KEYCLOAK_WEB_CLIENT_ID',
        'connected-neighbours-web',
      ),
      this.configService.get<string>(
        'KEYCLOAK_ADMIN_CLIENT_ID',
        'connected-neighbours-admin',
      ),
    ]);
    this.jwksUrl =
      this.enabled && internalUrl
        ? new URL(
            `${internalUrl}/realms/${realm}/protocol/openid-connect/certs`,
          )
        : null;
  }

  classify(token: string): BearerTokenKind {
    try {
      const [encodedHeader, encodedPayload, signature, extra] =
        token.split('.');
      if (!encodedHeader || !encodedPayload || !signature || extra) {
        throw new Error('Malformed token');
      }

      const header = this.decodePart(encodedHeader);
      const payload = this.decodePart(encodedPayload);
      const issuer = typeof payload.iss === 'string' ? payload.iss : null;

      if (issuer) {
        if (!this.issuer || issuer !== this.issuer) {
          throw new UnauthorizedException('Émetteur du jeton non autorisé');
        }

        if (header.alg !== 'RS256') {
          throw new UnauthorizedException('Algorithme du jeton non autorisé');
        }

        return BearerTokenKind.KEYCLOAK;
      }

      if (header.alg !== 'HS256') {
        throw new UnauthorizedException('Algorithme du jeton non autorisé');
      }

      return BearerTokenKind.LOCAL;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Jeton d’accès invalide');
    }
  }

  async verify(token: string): Promise<KeycloakTokenPayload> {
    if (!this.enabled || !this.jwksUrl || !this.issuer) {
      throw new ServiceUnavailableException(
        'Le service de connexion Keycloak est indisponible.',
      );
    }

    try {
      this.jwks ??= createRemoteJWKSet(this.jwksUrl, {
        timeoutDuration: this.timeoutDuration,
        cooldownDuration: 30_000,
        cacheMaxAge: 600_000,
      });

      const { payload, protectedHeader } =
        await jwtVerify<KeycloakTokenPayload>(token, this.jwks, {
          algorithms: ['RS256'],
          issuer: this.issuer,
          audience: this.audience,
          clockTolerance: 5,
        });

      if (protectedHeader.alg !== 'RS256') {
        throw new UnauthorizedException('Algorithme du jeton non autorisé');
      }

      if (!payload.azp || !this.allowedAuthorizedParties.has(payload.azp)) {
        throw new UnauthorizedException('Client OIDC non autorisé');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      const code = this.errorCode(error);
      const networkFailureCodes = new Set([
        'ECONNREFUSED',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'UND_ERR_CONNECT_TIMEOUT',
        'ERR_JWKS_TIMEOUT',
      ]);

      if (networkFailureCodes.has(code) || error instanceof TypeError) {
        throw new ServiceUnavailableException(
          'Le service de connexion Keycloak est momentanément indisponible.',
        );
      }

      throw new UnauthorizedException('Jeton Keycloak invalide ou expiré');
    }
  }

  getExpectedIssuer() {
    return this.issuer;
  }

  private errorCode(error: unknown): string {
    if (!error || typeof error !== 'object') return '';

    if ('code' in error && typeof error.code === 'string') return error.code;

    if ('cause' in error) {
      return this.errorCode(error.cause);
    }

    return '';
  }

  private decodePart(encoded: string) {
    const parsed: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    );

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Malformed token part');
    }

    return parsed as Record<string, unknown>;
  }

  private trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '');
  }
}
