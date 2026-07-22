import { ConfigService } from '@nestjs/config';
import neo4j from 'neo4j-driver';

import { GraphUnavailableError } from './graph.errors';
import { GraphHealthState } from './graph.types';
import { Neo4jService } from './neo4j.service';

jest.mock('neo4j-driver', () => ({
  __esModule: true,
  default: {
    auth: { basic: jest.fn(() => ({ scheme: 'basic' })) },
    driver: jest.fn(),
    session: { READ: 'READ', WRITE: 'WRITE' },
  },
}));

describe('Neo4jService', () => {
  const run = jest.fn();
  const closeSession = jest.fn();
  const session = { run, close: closeSession };
  const verifyConnectivity = jest.fn();
  const closeDriver = jest.fn();
  const driver = {
    session: jest.fn(() => session),
    verifyConnectivity,
    close: closeDriver,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (neo4j.driver as jest.Mock).mockReturnValue(driver);
    verifyConnectivity.mockResolvedValue(undefined);
    run.mockResolvedValue({
      records: [{ get: jest.fn(() => '5.26.0') }],
    });
    closeSession.mockResolvedValue(undefined);
    closeDriver.mockResolvedValue(undefined);
  });

  it('stays disabled when the optional graph configuration is absent', async () => {
    const service = new Neo4jService(config({ NEO4J_ENABLED: false }));

    expect(service.health.state).toBe(GraphHealthState.DISABLED);
    expect(service.isConfigured).toBe(false);
    expect(service.canAttempt).toBe(false);
    await expect(service.checkConnectivity()).resolves.toMatchObject({
      state: GraphHealthState.DISABLED,
      configured: false,
    });
    await expect(service.executeRead('RETURN 1')).rejects.toBeInstanceOf(
      GraphUnavailableError,
    );
    expect(neo4j.driver).not.toHaveBeenCalled();
  });

  it('uses a shared configured driver and closes every successful session', async () => {
    const service = new Neo4jService(enabledConfig());

    await expect(service.checkConnectivity(true)).resolves.toMatchObject({
      state: GraphHealthState.HEALTHY,
      serverVersion: '5.26.0',
    });
    await service.executeRead('RETURN $value', { value: 'safe' });

    expect(neo4j.driver).toHaveBeenCalledTimes(1);
    expect(verifyConnectivity).toHaveBeenCalledWith({ database: 'neo4j' });
    expect(run).toHaveBeenLastCalledWith(
      'RETURN $value',
      { value: 'safe' },
      { timeout: 250 },
    );
    expect(closeSession).toHaveBeenCalledTimes(2);
  });

  it('closes the session and opens a bounded circuit after a driver error', async () => {
    const service = new Neo4jService(enabledConfig());
    run.mockRejectedValueOnce(
      new Error('Neo.ClientError.Security.Unauthorized'),
    );

    await expect(service.executeWrite('RETURN 1')).rejects.toBeInstanceOf(
      GraphUnavailableError,
    );

    expect(closeSession).toHaveBeenCalledTimes(1);
    expect(service.health.state).toBe(GraphHealthState.DEGRADED);
    expect(service.health.errorCode).toBe('authentication_failed');
    expect(service.canAttempt).toBe(false);
  });

  it('bounds a hung query with the configured timeout', async () => {
    jest.useFakeTimers();
    const service = new Neo4jService(enabledConfig());
    run.mockReturnValueOnce(new Promise(() => undefined));

    const pending = service.executeRead('RETURN 1');
    const rejection = expect(pending).rejects.toBeInstanceOf(
      GraphUnavailableError,
    );
    await jest.advanceTimersByTimeAsync(251);
    await rejection;
    expect(closeSession).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('creates constraints idempotently and closes the driver on shutdown', async () => {
    const service = new Neo4jService(enabledConfig());

    await service.ensureConstraints();
    await service.onModuleDestroy();

    expect(run).toHaveBeenCalledTimes(9);
    expect(
      run.mock.calls.every(([statement]) =>
        String(statement).includes('IF NOT EXISTS'),
      ),
    ).toBe(true);
    expect(closeDriver).toHaveBeenCalledTimes(1);
  });
});

function enabledConfig() {
  return config({
    NEO4J_ENABLED: true,
    NEO4J_URI: 'bolt://neo4j:7687',
    NEO4J_USERNAME: 'neo4j',
    NEO4J_PASSWORD: 'not-exposed',
    NEO4J_DATABASE: 'neo4j',
    NEO4J_TIMEOUT_MS: 250,
    NEO4J_RETRY_COOLDOWN_MS: 1000,
  });
}

function config(values: Record<string, unknown>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}
