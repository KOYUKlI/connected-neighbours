import { ConfigService } from '@nestjs/config';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createServer, type Server } from 'http';
import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';

import { KeycloakTokenVerifier } from './keycloak-token-verifier.service';

describe('KeycloakTokenVerifier cryptography', () => {
  let server: Server;
  let baseUrl: string;
  let currentJwk: JWK;

  beforeAll(async () => {
    server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ keys: currentJwk ? [currentJwk] : [] }));
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('JWKS test server did not expose a TCP port');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  it('validates RS256, issuer, audience and azp against JWKS', async () => {
    const fixture = await signedToken();
    currentJwk = fixture.publicJwk;

    const payload = await makeVerifier(baseUrl).verify(fixture.token);

    expect(payload.sub).toBe('kc-subject');
    expect(payload.email_verified).toBe(true);
  });

  it('rejects an invalid audience', async () => {
    const fixture = await signedToken({ audience: 'another-api' });
    currentJwk = fixture.publicJwk;

    await expect(
      makeVerifier(baseUrl).verify(fixture.token),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unauthorized client even with a valid signature', async () => {
    const fixture = await signedToken({ azp: 'untrusted-client' });
    currentJwk = fixture.publicJwk;

    await expect(
      makeVerifier(baseUrl).verify(fixture.token),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not fall back when the JWKS endpoint is unavailable', async () => {
    const fixture = await signedToken();

    await expect(
      makeVerifier('http://127.0.0.1:1').verify(fixture.token),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('accepts a rotated signing key from a refreshed verifier', async () => {
    const first = await signedToken({ keyId: 'key-1' });
    currentJwk = first.publicJwk;
    await expect(
      makeVerifier(baseUrl).verify(first.token),
    ).resolves.toBeDefined();

    const second = await signedToken({ keyId: 'key-2' });
    currentJwk = second.publicJwk;
    await expect(
      makeVerifier(baseUrl).verify(second.token),
    ).resolves.toBeDefined();
  });
});

function makeVerifier(internalUrl: string) {
  return new KeycloakTokenVerifier(
    new ConfigService({
      KEYCLOAK_ENABLED: true,
      KEYCLOAK_PUBLIC_URL: 'http://localhost:8080',
      KEYCLOAK_INTERNAL_URL: internalUrl,
      KEYCLOAK_REALM: 'connected-neighbours',
      KEYCLOAK_API_AUDIENCE: 'connected-neighbours-api',
      KEYCLOAK_WEB_CLIENT_ID: 'connected-neighbours-web',
      KEYCLOAK_ADMIN_CLIENT_ID: 'connected-neighbours-admin',
      KEYCLOAK_REQUEST_TIMEOUT_MS: 500,
    }),
  );
}

async function signedToken(
  options: {
    audience?: string;
    azp?: string;
    keyId?: string;
  } = {},
) {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const keyId = options.keyId ?? 'test-key';
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = keyId;
  publicJwk.use = 'sig';
  publicJwk.alg = 'RS256';

  const token = await new SignJWT({
    email: 'alice@example.test',
    email_verified: true,
    azp: options.azp ?? 'connected-neighbours-web',
    amr: ['pwd', 'otp'],
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setIssuer('http://localhost:8080/realms/connected-neighbours')
    .setAudience(options.audience ?? 'connected-neighbours-api')
    .setSubject('kc-subject')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);

  return { token, publicJwk };
}
