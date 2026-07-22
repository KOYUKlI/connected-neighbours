import { GraphSyncService } from './graph-sync.service';
import { GraphEntityType, GraphSyncOperation } from './graph.types';
import { GraphSyncJobStatus } from './schemas/graph-sync-job.schema';

describe('GraphSyncService', () => {
  it('creates one active job per entity', async () => {
    const model = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      }),
      create: jest.fn().mockResolvedValue({ id: 'job-created' }),
    };
    const service = new GraphSyncService(model as never);

    await expect(
      service.enqueueStrict(GraphEntityType.EVENT, 'event-1'),
    ).resolves.toBe('job-created');
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        activeKey: 'event:event-1',
        operation: GraphSyncOperation.UPSERT,
        status: GraphSyncJobStatus.PENDING,
        attempts: 0,
      }),
    );
  });

  it('deduplicates an active entity job and keeps the latest operation', async () => {
    const existing = {
      _id: 'job-1',
      status: GraphSyncJobStatus.PENDING,
    };
    const execFind = jest.fn().mockResolvedValue(existing);
    const execUpdate = jest.fn().mockResolvedValue(existing);
    const model = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: execFind }),
        }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: execUpdate }),
      create: jest.fn(),
    };
    const service = new GraphSyncService(model as never);

    const id = await service.enqueueStrict(
      GraphEntityType.SERVICE,
      'service-1',
      GraphSyncOperation.DELETE,
    );

    expect(id).toBe('job-1');
    expect(model.findOne).toHaveBeenCalledWith({
      activeKey: 'service:service-1',
    });
    const updateCall = model.findByIdAndUpdate.mock.calls[0] as unknown as [
      string,
      { $set: { operation: GraphSyncOperation } },
    ];
    expect(updateCall[0]).toBe('job-1');
    expect(updateCall[1].$set.operation).toBe(GraphSyncOperation.DELETE);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('never propagates a queue persistence failure to a business mutation', async () => {
    const model = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockRejectedValue(new Error('database offline')),
          }),
        }),
      }),
    };
    const service = new GraphSyncService(model as never);

    await expect(service.enqueue(GraphEntityType.USER, 'user-1')).resolves.toBe(
      false,
    );
  });

  it('acquires pending or expired jobs with a conditional lock', async () => {
    const job = { id: 'job-1', attempts: 1 };
    const exec = jest.fn().mockResolvedValue(job);
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue({ exec }),
    };
    const service = new GraphSyncService(model as never);

    await expect(service.acquireNext('worker-1')).resolves.toBe(job);
    const acquireCall = model.findOneAndUpdate.mock.calls[0] as unknown as [
      {
        attempts: { $lt: number };
        $or: Array<{ status: GraphSyncJobStatus }>;
      },
      {
        $set: { status: GraphSyncJobStatus; workerId: string };
        $inc: { attempts: number };
      },
      { sort: Record<string, number> },
    ];
    expect(acquireCall[0].attempts.$lt).toBe(6);
    expect(acquireCall[0].$or.map((entry) => entry.status)).toEqual([
      GraphSyncJobStatus.PENDING,
      GraphSyncJobStatus.PROCESSING,
    ]);
    expect(acquireCall[1].$set).toMatchObject({
      status: GraphSyncJobStatus.PROCESSING,
      workerId: 'worker-1',
    });
    expect(acquireCall[1].$inc.attempts).toBe(1);
    expect(acquireCall[2].sort).toEqual({ nextAttemptAt: 1, createdAt: 1 });
  });

  it('uses bounded backoff and releases the active key after the final attempt', async () => {
    const exec = jest.fn().mockResolvedValue(undefined);
    const model = { updateOne: jest.fn().mockReturnValue({ exec }) };
    const service = new GraphSyncService(model as never);
    const job = {
      id: 'job-1',
      workerId: 'worker-1',
      attempts: 6,
      activeKey: 'service:service-1',
    };

    await service.fail(job as never, new Error('secret URI must not leak'));

    const failureCall = model.updateOne.mock.calls[0] as unknown as [
      { _id: string; workerId: string },
      { $set: Record<string, unknown> },
    ];
    expect(failureCall[0]).toEqual({
      _id: 'job-1',
      workerId: 'worker-1',
    });
    const update = failureCall[1].$set;
    expect(update).toMatchObject({
      status: GraphSyncJobStatus.FAILED,
      activeKey: null,
      lastErrorCode: 'graph_error',
    });
    expect(JSON.stringify(update)).not.toContain('secret URI');
  });
});
