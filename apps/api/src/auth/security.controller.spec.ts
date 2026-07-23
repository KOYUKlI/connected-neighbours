import { ConfigService } from '@nestjs/config';

import { AuthenticationProvider } from './authenticated-identity.type';
import { Role } from './role.enum';
import { SecurityController } from './security.controller';

const currentUser = {
  sub: '507f1f77bcf86cd799439011',
  email: 'alice@example.test',
  displayName: 'Alice',
  role: Role.RESIDENT,
  neighborhoodId: 'quartier-centre',
  identity: {
    provider: AuthenticationProvider.KEYCLOAK,
    internalUserId: '507f1f77bcf86cd799439011',
    externalSubject: 'kc-subject',
    emailVerified: true,
    tokenIssuedAt: new Date(),
    tokenExpiresAt: new Date(Date.now() + 60_000),
    authenticationMethods: ['pwd', 'otp'],
    mfaSatisfied: true,
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-centre',
    displayName: 'Alice',
  },
};

describe('SecurityController', () => {
  const users = {
    findById: jest.fn(),
    requireKeycloakSubject: jest.fn(),
  };
  const audit = { record: jest.fn(), listForUser: jest.fn() };
  const keycloak = {
    availability: jest.fn(),
    getUserSecurity: jest.fn(),
    listSessions: jest.fn(),
    sendRequiredActionEmail: jest.fn(),
    logoutAll: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string, fallback: unknown) => {
      const values: Record<string, unknown> = {
        KEYCLOAK_ENABLED: true,
        KEYCLOAK_PUBLIC_URL: 'http://localhost:8080',
        KEYCLOAK_REALM: 'connected-neighbours',
      };
      return values[key] ?? fallback;
    }),
  };
  const controller = new SecurityController(
    users as never,
    audit as never,
    config as unknown as ConfigService,
    keycloak as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    users.findById.mockResolvedValue({
      identityProvider: 'linked',
      emailVerified: true,
      keycloakSubject: 'kc-subject',
      identityLinkedAt: new Date('2026-01-01T00:00:00Z'),
      onboardingCompleted: true,
    });
    keycloak.availability.mockReturnValue('available');
  });

  it('keeps the security summary available when Keycloak is down', async () => {
    keycloak.getUserSecurity.mockRejectedValue(new Error('offline'));

    await expect(controller.getSecurity(currentUser)).resolves.toMatchObject({
      identityProvider: 'linked',
      keycloakAvailability: 'unavailable',
      mfaConfigured: null,
      sessionCount: null,
      session: { mfaSatisfied: true },
    });
  });

  it('never exposes raw Keycloak session identifiers', async () => {
    users.requireKeycloakSubject.mockResolvedValue('kc-subject');
    keycloak.listSessions.mockResolvedValue([
      {
        startedAt: '2026-01-01T00:00:00.000Z',
        lastAccessAt: '2026-01-01T00:10:00.000Z',
        rememberMe: false,
        clients: ['Connected Neighbours Resident Web'],
      },
    ]);

    const result = await controller.getSessions(currentUser);
    expect(JSON.stringify(result)).not.toContain('kc-subject');
    expect(result).toHaveLength(1);
  });
});
