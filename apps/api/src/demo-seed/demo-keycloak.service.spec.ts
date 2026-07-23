import { ConfigService } from '@nestjs/config';

import { DemoKeycloakService } from './demo-keycloak.service';

describe('DemoKeycloakService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('stays disabled without requiring Keycloak', async () => {
    const service = new DemoKeycloakService(
      new ConfigService({ KEYCLOAK_ENABLED: false }),
    );

    await expect(service.synchronize(new Map())).resolves.toEqual([]);
    await expect(service.status()).resolves.toEqual([]);
  });

  it('does not expose password values in configuration errors', async () => {
    const service = new DemoKeycloakService(
      new ConfigService({
        KEYCLOAK_ENABLED: true,
        KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
        KEYCLOAK_REALM: 'connected-neighbours',
        KEYCLOAK_SERVICE_CLIENT_ID: 'connected-neighbours-service',
        KEYCLOAK_SERVICE_CLIENT_SECRET: '',
      }),
    );

    await expect(service.synchronize(new Map())).rejects.toThrow(
      'configuration Keycloak du seed est incomplète',
    );
  });

  it('refuses all bootstrap operations in production', async () => {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const service = new DemoKeycloakService(
        new ConfigService({
          KEYCLOAK_ENABLED: true,
          KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
          KEYCLOAK_REALM: 'connected-neighbours',
          KEYCLOAK_SERVICE_CLIENT_ID: 'connected-neighbours-service',
          KEYCLOAK_SERVICE_CLIENT_SECRET: 'test-only-secret',
        }),
      );
      await expect(
        service.synchronize(
          new Map([
            ['SEED_DEMO_RESIDENT_PASSWORD', 'not-logged'],
            ['SEED_DEMO_ADMIN_PASSWORD', 'not-logged'],
            ['SEED_DEMO_MODERATOR_PASSWORD', 'not-logged'],
            ['SEED_DEMO_LEGACY_PASSWORD', 'not-logged'],
          ]),
        ),
      ).rejects.toThrow('interdit en production');
    } finally {
      process.env.NODE_ENV = previousEnvironment;
    }
  });
});
