import { GraphReconciliationService } from './graph-reconciliation.service';
import { GraphEntityType } from './graph.types';

describe('GraphReconciliationService', () => {
  it('projects neighborhoods before users so LIVES_IN can be rebuilt', async () => {
    const calls: string[] = [];
    const neighborhoodId = '000000000000000000000001';
    const userId = '000000000000000000000002';
    const service = new GraphReconciliationService(
      modelWithPages([[{ _id: userId }]]) as never,
      modelWithPages([[{ _id: neighborhoodId }]]) as never,
      {} as never,
      {} as never,
      {} as never,
      {
        project: jest.fn((type: GraphEntityType) => {
          calls.push(type);
          return Promise.resolve();
        }),
        cleanupStale: jest.fn().mockResolvedValue(0),
      } as never,
    );

    await service.reconcile([
      GraphEntityType.USER,
      GraphEntityType.NEIGHBORHOOD,
    ]);

    expect(calls).toEqual([GraphEntityType.NEIGHBORHOOD, GraphEntityType.USER]);
  });

  it('projects MongoDB identifiers in bounded batches and records partial errors', async () => {
    const identifiers = Array.from({ length: 101 }, (_, index) =>
      index.toString(16).padStart(24, '0'),
    );
    const userModel = modelWithPages([
      identifiers.slice(0, 100).map((_id) => ({ _id })),
      identifiers.slice(100).map((_id) => ({ _id })),
    ]);
    const projection = {
      project: jest.fn((_type: GraphEntityType, entityId: string) => {
        if (entityId === identifiers[50]) {
          return Promise.reject(new Error('temporary outage'));
        }
        return Promise.resolve();
      }),
      cleanupStale: jest.fn().mockResolvedValue(2),
    };
    const service = createService(userModel, projection);

    const report = await service.reconcile([GraphEntityType.USER]);

    expect(userModel.find).toHaveBeenCalledTimes(2);
    expect(projection.project).toHaveBeenCalledTimes(101);
    expect(projection.cleanupStale).toHaveBeenCalledWith(
      GraphEntityType.USER,
      report.runId,
    );
    expect(report.projected.user).toBe(100);
    expect(report.removed.user).toBe(2);
    expect(report.errors).toEqual([
      {
        entityType: GraphEntityType.USER,
        entityId: identifiers[50],
        code: 'graph_error',
      },
    ]);
    expect(service.latest).toBe(report);
  });

  it('supports a non-destructive dry run', async () => {
    const userModel = {
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(42),
      }),
    };
    const projection = {
      project: jest.fn(),
      cleanupStale: jest.fn(),
    };
    const service = createService(userModel, projection);

    const report = await service.reconcile([GraphEntityType.USER], true);

    expect(report.projected.user).toBe(42);
    expect(projection.project).not.toHaveBeenCalled();
    expect(projection.cleanupStale).not.toHaveBeenCalled();
  });
});

function createService(userModel: unknown, projection: unknown) {
  const unusedModel = {};
  return new GraphReconciliationService(
    userModel as never,
    unusedModel as never,
    unusedModel as never,
    unusedModel as never,
    unusedModel as never,
    projection as never,
  );
}

function modelWithPages(pages: Array<Array<{ _id: string }>>) {
  const exec = jest.fn();
  pages.forEach((page) => exec.mockResolvedValueOnce(page));
  return {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec }),
          }),
        }),
      }),
    }),
  };
}
