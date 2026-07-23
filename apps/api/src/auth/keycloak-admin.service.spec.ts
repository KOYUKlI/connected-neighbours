import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AccountSecurityAction } from './dto/request-account-action.dto';
import { KeycloakAdminService } from './keycloak-admin.service';

describe('KeycloakAdminService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('stays disabled when Keycloak administration is not configured', async () => {
    const service = makeService({ KEYCLOAK_ENABLED: false });

    expect(service.availability()).toBe('disabled');
    await expect(service.logoutAll('subject')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns only safe session and MFA summaries with one service token', async () => {
    const fetchMock = jest.fn((url: string | URL | Request) => {
      const value = requestUrl(url);
      if (value.endsWith('/protocol/openid-connect/token')) {
        return json({ access_token: 'service-token', expires_in: 300 });
      }
      if (value.endsWith('/credentials')) {
        return json([{ id: 'credential-secret-id', type: 'otp' }]);
      }
      if (value.endsWith('/sessions')) {
        return json([
          {
            id: 'session-secret-id',
            userId: 'subject',
            ipAddress: '192.0.2.1',
            start: 1_700_000_000_000,
            lastAccess: 1_700_000_030_000,
            rememberMe: true,
            clients: {
              internalClientId: 'Connected Neighbours Resident Web',
            },
          },
        ]);
      }
      return json({ enabled: true, emailVerified: true });
    });
    global.fetch = fetchMock as typeof fetch;

    const result = await makeService().getUserSecurity('kc-subject');

    expect(result).toEqual({
      availability: 'available',
      enabled: true,
      emailVerified: true,
      mfaConfigured: true,
      sessionCount: 1,
      sessions: [
        {
          startedAt: '2023-11-14T22:13:20.000Z',
          lastAccessAt: '2023-11-14T22:13:50.000Z',
          rememberMe: true,
          clients: ['Connected Neighbours Resident Web'],
        },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(
      /service-token|credential-secret-id|session-secret-id|192\.0\.2\.1|subject/,
    );
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        requestUrl(url).endsWith('/protocol/openid-connect/token'),
      ),
    ).toHaveLength(1);
  });

  it('sends only an allow-listed required action', async () => {
    const fetchMock = jest.fn(
      (url: string | URL | Request, init?: RequestInit) => {
        const value = requestUrl(url);
        if (value.endsWith('/protocol/openid-connect/token')) {
          return json({ access_token: 'service-token', expires_in: 300 });
        }
        expect(value).toContain('/execute-actions-email');
        expect(init?.method).toBe('PUT');
        expect(init?.body).toBe(JSON.stringify(['UPDATE_PASSWORD']));
        return Promise.resolve(new Response(null, { status: 204 }));
      },
    );
    global.fetch = fetchMock as typeof fetch;

    await makeService().sendRequiredActionEmail(
      'kc-subject',
      AccountSecurityAction.UPDATE_PASSWORD,
    );
  });

  it('normalizes a Keycloak network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('connection refused'));

    await expect(makeService().listSessions('kc-subject')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});

function makeService(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    KEYCLOAK_ENABLED: true,
    KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
    KEYCLOAK_REALM: 'connected-neighbours',
    KEYCLOAK_SERVICE_CLIENT_ID: 'connected-neighbours-service',
    KEYCLOAK_SERVICE_CLIENT_SECRET: 'test-only-secret',
    KEYCLOAK_REQUEST_TIMEOUT_MS: 500,
    ...overrides,
  };
  return new KeycloakAdminService({
    get: (key: string, fallback?: unknown) => values[key] ?? fallback,
  } as ConfigService);
}

function requestUrl(input: string | URL | Request) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function json(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
