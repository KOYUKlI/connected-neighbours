import { BadRequestException, ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';

import { AuthenticationProvider } from './authenticated-identity.type';
import type { AuthenticatedUser } from './authenticated-user.type';
import { IdentityLinkService } from './identity-link.service';
import { Role } from './role.enum';
import { IdentityLinkRequestStatus } from './schemas/identity-link-request.schema';
import { SecurityAuditService } from './security-audit.service';
import { UsersService } from './users.service';

describe('IdentityLinkService', () => {
  const model = {
    updateMany: jest.fn<Promise<{ modifiedCount: number }>, [unknown]>(),
    create: jest.fn<Promise<unknown>, [unknown]>(),
    findOne: jest.fn<ReturnType<typeof queryResult>, [unknown]>(),
  };
  const users = {
    findIdentityById: jest.fn(),
    findByKeycloakSubject: jest.fn(),
    linkKeycloakIdentity: jest.fn(),
    toPublicUser: jest.fn((user: unknown) => user),
  } as unknown as UsersService;
  const audit = {
    record: jest.fn(),
  } as unknown as SecurityAuditService;
  const service = new IdentityLinkService(model as never, users, audit);

  beforeEach(() => jest.clearAllMocks());

  it('stores only a hash of the short-lived link token', async () => {
    model.updateMany.mockResolvedValue({ modifiedCount: 0 });
    model.create.mockResolvedValue({});

    const result = await service.requestLink(localUser());

    const persisted = model.create.mock.calls[0][0] as {
      tokenHash: string;
      expiresAt: Date;
    };
    expect(result.linkToken).toHaveLength(43);
    expect(persisted.tokenHash).not.toBe(result.linkToken);
    expect(persisted.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persisted.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('links the verified subject once and consumes the request', async () => {
    const rawToken = 'a'.repeat(43);
    const request = linkRequest(rawToken);
    model.findOne.mockReturnValue(queryResult(request));
    jest.spyOn(users, 'findIdentityById').mockResolvedValue(localAccount());
    jest.spyOn(users, 'findByKeycloakSubject').mockResolvedValue(null);
    const linkKeycloakIdentity = jest
      .spyOn(users, 'linkKeycloakIdentity')
      .mockResolvedValue(localAccount({ identityProvider: 'linked' }));

    const result = await service.completeLink(rawToken, keycloakPayload());

    expect(linkKeycloakIdentity).toHaveBeenCalledWith({
      userId: '507f1f77bcf86cd799439011',
      keycloakSubject: 'kc-subject',
      emailVerified: true,
    });
    expect(request.status).toBe(IdentityLinkRequestStatus.USED);
    expect(request.save).toHaveBeenCalledTimes(1);
    expect(result.linked).toBe(true);
  });

  it('refuses an expired or already consumed request', async () => {
    model.findOne.mockReturnValue(queryResult(null));
    const linkKeycloakIdentity = jest.spyOn(users, 'linkKeycloakIdentity');

    await expect(
      service.completeLink('b'.repeat(43), keycloakPayload()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(linkKeycloakIdentity).not.toHaveBeenCalled();
  });

  it('refuses a subject already owned by another account', async () => {
    const rawToken = 'c'.repeat(43);
    const request = linkRequest(rawToken);
    model.findOne.mockReturnValue(queryResult(request));
    jest.spyOn(users, 'findIdentityById').mockResolvedValue(localAccount());
    jest
      .spyOn(users, 'findByKeycloakSubject')
      .mockResolvedValue(localAccount({ id: 'another-user' }));

    await expect(
      service.completeLink(rawToken, keycloakPayload()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(request.status).toBe(IdentityLinkRequestStatus.FAILED);
  });
});

function localUser(): AuthenticatedUser {
  return {
    sub: '507f1f77bcf86cd799439011',
    email: 'alice@example.test',
    displayName: 'Alice',
    role: Role.RESIDENT,
    neighborhoodId: 'centre',
    identity: {
      provider: AuthenticationProvider.LOCAL,
      internalUserId: '507f1f77bcf86cd799439011',
      email: 'alice@example.test',
      emailVerified: true,
      tokenIssuedAt: new Date(),
      tokenExpiresAt: new Date(Date.now() + 60_000),
      authenticationMethods: ['password'],
      mfaSatisfied: false,
      role: Role.RESIDENT,
      neighborhoodId: 'centre',
      displayName: 'Alice',
    },
  };
}

function localAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: '507f1f77bcf86cd799439011',
    email: 'alice@example.test',
    displayName: 'Alice',
    role: Role.RESIDENT,
    neighborhoodId: 'centre',
    passwordHash: 'local-hash',
    isActive: true,
    ...overrides,
  } as never;
}

function keycloakPayload() {
  return {
    sub: 'kc-subject',
    email: 'alice@example.test',
    email_verified: true,
    iat: 1,
    exp: 9999999999,
  };
}

function linkRequest(rawToken: string) {
  return {
    userId: '507f1f77bcf86cd799439011',
    tokenHash: createHash('sha256').update(rawToken).digest('hex'),
    status: IdentityLinkRequestStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function queryResult(value: unknown) {
  return {
    select: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(value),
    }),
  };
}
