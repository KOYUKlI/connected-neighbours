import { ConfigService } from '@nestjs/config';

import { GraphSyncWorker } from './graph-sync.worker';
import { GraphEntityType, GraphSyncOperation } from './graph.types';

describe('GraphSyncWorker', () => {
  it('processes a bounded idempotent job and completes it', async () => {
    const job = {
      id: 'job-1',
      entityType: GraphEntityType.SERVICE,
      entityId: 'service-1',
      operation: GraphSyncOperation.UPSERT,
    };
    const sync = {
      acquireNext: jest
        .fn()
        .mockResolvedValueOnce(job)
        .mockResolvedValueOnce(null),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn(),
    };
    const projection = { project: jest.fn().mockResolvedValue(undefined) };
    const neo4j = { canAttempt: true, isConfigured: true };
    const config = { get: jest.fn() } as unknown as ConfigService;
    const worker = new GraphSyncWorker(
      config,
      neo4j as never,
      sync as never,
      projection as never,
    );

    await expect(worker.processBatch(5)).resolves.toEqual({ processed: 1 });
    expect(projection.project).toHaveBeenCalledWith(
      GraphEntityType.SERVICE,
      'service-1',
      GraphSyncOperation.UPSERT,
    );
    expect(sync.complete).toHaveBeenCalledWith(job);
    expect(sync.fail).not.toHaveBeenCalled();
  });

  it('does not acquire jobs while the graph circuit is unavailable', async () => {
    const sync = { acquireNext: jest.fn() };
    const worker = new GraphSyncWorker(
      { get: jest.fn() } as unknown as ConfigService,
      { canAttempt: false, isConfigured: true } as never,
      sync as never,
      { project: jest.fn() } as never,
    );

    await expect(worker.processBatch()).resolves.toEqual({ processed: 0 });
    expect(sync.acquireNext).not.toHaveBeenCalled();
  });
});
