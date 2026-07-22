import { UnauthorizedException } from '@nestjs/common';

import { AuthenticationProvider } from './authenticated-identity.type';
import { IdentityLinkRequiredException } from './identity-link-required.exception';
import { IdentityResolutionService } from './identity-resolution.service';
import { Role } from './role.enum';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';

describe('IdentityResolutionService', () => {
  const users = {
    findById: jest.fn(),
    findByKeycloakSubject: jest.fn(),
    findIdentityByEmail: jest.fn(),
    markIdentityLinkRequired: jest.fn(),
    createKeycloakUser: jest.fn(),
    touchIdentitySync: jest.fn(),
  } as unknown as UsersService;
  const audit = {
    record: jest.fn(),
  } as unknown as SecurityAuditService;

  const service = new IdentityResolutionService(users, audit);

  beforeEach(() => jest.clearAllMocks());

  it('reloads the MongoDB role for a local token', async () => {
    jest
      .spyOn(users, 'findById')
      .mockResolvedValue(user({ role: Role.RESIDENT }));

    const resolved = await service.resolveLocal({
      sub: '507f1f77bcf86cd799439011',
      email: 'stale@example.test',
      role: Role.ADMIN,
      displayName: 'Stale',
      neighborhoodId: 'old',
      iat: 1,
      exp: 9999999999,
    });

    expect(resolved.role).toBe(Role.RESIDENT);
    expect(resolved.identity?.provider).toBe(AuthenticationProvider.LOCAL);
  });

  it('refuses a disabled MongoDB account with a valid Keycloak identity', async () => {
    jest
      .spyOn(users, 'findByKeycloakSubject')
      .mockResolvedValue(user({ isActive: false }));

    await expect(
      service.resolveKeycloak(keycloakPayload()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('never links an existing local account by email automatically', async () => {
    jest.spyOn(users, 'findByKeycloakSubject').mockResolvedValue(null);
    jest.spyOn(users, 'findIdentityByEmail').mockResolvedValue(user());
    const createKeycloakUser = jest.spyOn(users, 'createKeycloakUser');

    await expect(
      service.resolveKeycloak(keycloakPayload()),
    ).rejects.toBeInstanceOf(IdentityLinkRequiredException);
    expect(createKeycloakUser).not.toHaveBeenCalled();
  });

  it('auto-provisions only a resident when no local account exists', async () => {
    jest.spyOn(users, 'findByKeycloakSubject').mockResolvedValue(null);
    jest.spyOn(users, 'findIdentityByEmail').mockResolvedValue(null);
    const createKeycloakUser = jest
      .spyOn(users, 'createKeycloakUser')
      .mockResolvedValue(user());

    const resolved = await service.resolveKeycloak(keycloakPayload());

    expect(createKeycloakUser).toHaveBeenCalledWith(
      expect.objectContaining({
        keycloakSubject: 'kc-subject',
        email: 'alice@example.test',
      }),
    );
    expect(resolved.role).toBe(Role.RESIDENT);
  });
});

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: '507f1f77bcf86cd799439011',
    email: 'alice@example.test',
    displayName: 'Alice',
    role: Role.RESIDENT,
    neighborhoodId: 'centre',
    emailVerified: true,
    isActive: true,
    ...overrides,
  } as never;
}

function keycloakPayload() {
  return {
    sub: 'kc-subject',
    email: 'Alice@Example.Test',
    email_verified: true,
    name: 'Alice',
    iat: 1,
    exp: 9999999999,
    amr: ['pwd', 'otp'],
    acr: '2',
  };
}
