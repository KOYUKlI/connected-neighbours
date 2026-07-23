import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

import { DualAuthService } from './dual-auth.service';
import { IdentityResolutionService } from './identity-resolution.service';
import {
  BearerTokenKind,
  KeycloakTokenVerifier,
} from './keycloak-token-verifier.service';

describe('DualAuthService', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const verifier = {
    classify: jest.fn(),
    verify: jest.fn(),
  } as unknown as KeycloakTokenVerifier;
  const resolution = {
    resolveLocal: jest.fn(),
    resolveKeycloak: jest.fn(),
  } as unknown as IdentityResolutionService;

  beforeEach(() => jest.clearAllMocks());

  it('uses only the local validator for a local JWT', async () => {
    const payload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'alice@example.test',
      role: 'resident',
      displayName: 'Alice',
      neighborhoodId: 'centre',
      iat: 1,
      exp: 9999999999,
    };
    jest.spyOn(verifier, 'classify').mockReturnValue(BearerTokenKind.LOCAL);
    const keycloakVerify = jest.spyOn(verifier, 'verify');
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    const resolveLocal = jest
      .spyOn(resolution, 'resolveLocal')
      .mockResolvedValue({
        sub: payload.sub,
      } as never);

    const service = makeService(true);
    await service.authenticate('local-token');

    expect(keycloakVerify).not.toHaveBeenCalled();
    expect(resolveLocal).toHaveBeenCalledWith(payload);
  });

  it('uses only JWKS validation for a Keycloak token', async () => {
    const payload = { sub: 'keycloak-subject' };
    jest.spyOn(verifier, 'classify').mockReturnValue(BearerTokenKind.KEYCLOAK);
    const localVerify = jest.spyOn(jwtService, 'verifyAsync');
    jest.spyOn(verifier, 'verify').mockResolvedValue(payload);
    const resolveKeycloak = jest
      .spyOn(resolution, 'resolveKeycloak')
      .mockResolvedValue({
        sub: 'mongo-user',
      } as never);

    await makeService(true).authenticate('keycloak-token');

    expect(localVerify).not.toHaveBeenCalled();
    expect(resolveKeycloak).toHaveBeenCalledWith(payload);
  });

  it('can disable local authentication without affecting classification', async () => {
    jest.spyOn(verifier, 'classify').mockReturnValue(BearerTokenKind.LOCAL);
    const localVerify = jest.spyOn(jwtService, 'verifyAsync');

    await expect(
      makeService(false).authenticate('local-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(localVerify).not.toHaveBeenCalled();
  });

  function makeService(localEnabled: boolean) {
    return new DualAuthService(
      new ConfigService({
        AUTH_LOCAL_ENABLED: localEnabled,
        JWT_SECRET: 'test-secret-with-at-least-sixteen-characters',
      }),
      jwtService,
      verifier,
      resolution,
    );
  }
});
