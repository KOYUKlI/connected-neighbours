import { ConflictException } from '@nestjs/common';

import { DemoSeedOrchestrator } from './demo-seed-orchestrator.service';

describe('DemoSeedOrchestrator', () => {
  const userModel = {
    find: jest.fn(() => ({
      select: () => ({
        lean: () => ({ exec: () => Promise.resolve([]) }),
      }),
    })),
  };
  const seedRecordModel = {
    aggregate: jest.fn(() => ({ exec: () => Promise.resolve([]) })),
  };
  const keycloakService = {
    isEnabled: false,
    status: jest.fn(),
  };
  const businessSeed = {
    planReconciliation: jest.fn(() =>
      Promise.resolve({
        actions: [] as Array<Record<string, unknown>>,
        blocked: [] as Array<Record<string, unknown>>,
        summary: {},
      }),
    ),
    status: jest.fn(() =>
      Promise.resolve({
        counts: {},
        storage: { status: 'ok', provider: 'memory-test-adapter' },
        graph: { enabled: false, status: 'disabled', jobs: {} },
      }),
    ),
  };
  let orchestrator: DemoSeedOrchestrator;
  let previousNodeEnv: string | undefined;

  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
    orchestrator = new DemoSeedOrchestrator(
      userModel as never,
      seedRecordModel as never,
      {} as never,
      keycloakService as never,
      businessSeed as never,
    );
  });

  afterEach(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  it('refuse toute exécution en production avant de lire les secrets', async () => {
    process.env.NODE_ENV = 'production';

    await expect(orchestrator.run('all')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuse un reset sans confirmation exacte', async () => {
    await expect(orchestrator.reset('presque')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rend le statut consultable sans variable de mot de passe', async () => {
    delete process.env.SEED_DEMO_RESIDENT_PASSWORD;

    const status = await orchestrator.status();

    expect(status.mongodb.users).toBe(0);
    expect(status.services.minio).toBe('ok');
    expect(status.services.graph).toBe('disabled');
    expect(keycloakService.status).not.toHaveBeenCalled();
  });

  it('refuse de muter avant lecture des secrets si une réconciliation est requise', async () => {
    businessSeed.planReconciliation.mockResolvedValueOnce({
      actions: [
        {
          kind: 'delete',
          entityType: 'service',
          entityId: 'stale-service',
          reason: 'test',
        },
      ],
      blocked: [],
      summary: { service: 1 },
    });
    delete process.env.SEED_DEMO_RESIDENT_PASSWORD;

    await expect(orchestrator.run('all')).rejects.toThrow(
      'Une réconciliation du seed est requise',
    );
  });
});
