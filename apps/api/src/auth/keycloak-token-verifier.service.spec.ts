import { ConfigService } from '@nestjs/config';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  BearerTokenKind,
  KeycloakTokenVerifier,
} from './keycloak-token-verifier.service';

describe('KeycloakTokenVerifier', () => {
  const config = new ConfigService({
    KEYCLOAK_ENABLED: false,
    KEYCLOAK_PUBLIC_URL: 'http://localhost:8080',
    KEYCLOAK_INTERNAL_URL: 'http://localhost:8080',
    KEYCLOAK_REALM: 'connected-neighbours',
    KEYCLOAK_API_AUDIENCE: 'connected-neighbours-api',
    KEYCLOAK_WEB_CLIENT_ID: 'connected-neighbours-web',
    KEYCLOAK_ADMIN_CLIENT_ID: 'connected-neighbours-admin',
  });

  const verifier = new KeycloakTokenVerifier(config);

  it('classifies an explicit HS256 token without issuer as local', () => {
    expect(
      verifier.classify(
        unsignedToken({ alg: 'HS256', typ: 'JWT' }, { sub: 'local-user' }),
      ),
    ).toBe(BearerTokenKind.LOCAL);
  });

  it('classifies an RS256 token from the configured issuer as Keycloak', () => {
    expect(
      verifier.classify(
        unsignedToken(
          { alg: 'RS256', typ: 'JWT' },
          {
            iss: 'http://localhost:8080/realms/connected-neighbours',
            sub: 'external-user',
          },
        ),
      ),
    ).toBe(BearerTokenKind.KEYCLOAK);
  });

  it('rejects an unknown issuer without trying the local validator', () => {
    expect(() =>
      verifier.classify(
        unsignedToken(
          { alg: 'RS256' },
          { iss: 'https://untrusted.example/realms/other' },
        ),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects a non-HS256 local token', () => {
    expect(() =>
      verifier.classify(unsignedToken({ alg: 'none' }, { sub: 'local-user' })),
    ).toThrow(UnauthorizedException);
  });

  it('reports Keycloak as unavailable when the feature is disabled', async () => {
    await expect(verifier.verify('unused')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

function unsignedToken(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
) {
  return [
    Buffer.from(JSON.stringify(header)).toString('base64url'),
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    'signature',
  ].join('.');
}
