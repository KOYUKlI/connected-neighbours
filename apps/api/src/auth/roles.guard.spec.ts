import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthenticationProvider } from './authenticated-identity.type';
import type { AuthenticatedUser } from './authenticated-user.type';
import { Role } from './role.enum';
import { RolesGuard } from './roles.guard';

const adminUser = (
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser => ({
  sub: '507f1f77bcf86cd799439011',
  email: 'admin@example.test',
  displayName: 'Admin',
  role: Role.ADMIN,
  neighborhoodId: 'centre',
  ...overrides,
});

describe('RolesGuard administrative MFA', () => {
  const requiredRoles = jest.fn<Role[] | undefined, []>();
  const reflector = {
    getAllAndOverride: requiredRoles,
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  it('allows a Keycloak admin whose signed identity satisfied MFA', () => {
    requiredRoles.mockReturnValue([Role.ADMIN]);
    expect(
      guard.canActivate(
        contextWith(
          adminUser({
            identity: keycloakIdentity(true),
          }),
        ),
      ),
    ).toBe(true);
  });

  it('rejects a Keycloak admin without an MFA proof', () => {
    requiredRoles.mockReturnValue([Role.ADMIN]);
    expect(() =>
      guard.canActivate(
        contextWith(
          adminUser({
            identity: keycloakIdentity(false),
          }),
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('keeps a local administrative JWT compatible during migration', () => {
    requiredRoles.mockReturnValue([Role.ADMIN]);
    expect(
      guard.canActivate(
        contextWith(
          adminUser({
            identity: {
              ...keycloakIdentity(false),
              provider: AuthenticationProvider.LOCAL,
            },
          }),
        ),
      ),
    ).toBe(true);
  });

  it('never trusts a Keycloak realm role over the MongoDB role', () => {
    requiredRoles.mockReturnValue([Role.ADMIN]);
    expect(
      guard.canActivate(
        contextWith(
          adminUser({
            role: Role.RESIDENT,
            identity: keycloakIdentity(true),
          }),
        ),
      ),
    ).toBe(false);
  });
});

function contextWith(user: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function keycloakIdentity(mfaSatisfied: boolean) {
  return {
    provider: AuthenticationProvider.KEYCLOAK,
    internalUserId: '507f1f77bcf86cd799439011',
    externalSubject: 'kc-subject',
    email: 'admin@example.test',
    emailVerified: true,
    tokenIssuedAt: new Date(),
    tokenExpiresAt: new Date(Date.now() + 60_000),
    authenticationMethods: mfaSatisfied ? ['pwd', 'otp'] : ['pwd'],
    mfaSatisfied,
    role: Role.ADMIN,
    neighborhoodId: 'centre',
    displayName: 'Admin',
  };
}
