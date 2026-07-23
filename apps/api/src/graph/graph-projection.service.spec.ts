import { GraphProjectionService } from './graph-projection.service';
import { GraphEntityType, GraphSyncOperation } from './graph.types';

function queryResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(value),
      }),
    }),
  };
}

describe('GraphProjectionService', () => {
  it('projects only the minimal public user data through Cypher parameters', async () => {
    const userModel = {
      findById: jest.fn().mockReturnValue(
        queryResult({
          _id: '507f1f77bcf86cd799439011',
          displayName: 'Alice Martin',
          email: 'private@example.test',
          phone: '0102030405',
          neighborhoodId: 'quartier-centre',
          interests: ['Bricolage'],
          profileVisibility: 'neighborhood',
          isActive: true,
          updatedAt: new Date('2026-07-22T10:00:00.000Z'),
        }),
      ),
    };
    const neighborhoodModel = {
      findOne: jest
        .fn()
        .mockReturnValue(queryResult({ _id: '507f191e810c19729de860ea' })),
    };
    const neo4j = {
      executeWrite: jest.fn().mockResolvedValue({ records: [] }),
    };
    const service = new GraphProjectionService(
      userModel as never,
      neighborhoodModel as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      neo4j as never,
    );

    await service.project(
      GraphEntityType.USER,
      '507f1f77bcf86cd799439011',
      GraphSyncOperation.UPSERT,
    );

    const [, parameters] = neo4j.executeWrite.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(parameters).toMatchObject({
      mongoId: '507f1f77bcf86cd799439011',
      displayName: 'Alice Martin',
      interests: ['bricolage'],
      neighborhoodMongoId: '507f191e810c19729de860ea',
    });
    expect(parameters).not.toHaveProperty('email');
    expect(parameters).not.toHaveProperty('phone');
    expect(JSON.stringify(parameters)).not.toContain('private@example.test');
  });

  it('projects neighborhoods without copying their GeoJSON polygon', async () => {
    const neighborhoodModel = {
      findById: jest.fn().mockReturnValue(
        queryResult({
          _id: '507f191e810c19729de860ea',
          name: 'Quartier Centre',
          slug: 'quartier-centre',
          city: 'Paris',
          status: 'active',
          geometry: { type: 'Polygon', coordinates: [[[2.3, 48.8]]] },
        }),
      ),
    };
    const neo4j = {
      executeWrite: jest.fn().mockResolvedValue({ records: [] }),
    };
    const service = createProjection({ neighborhoodModel, neo4j });

    await service.project(
      GraphEntityType.NEIGHBORHOOD,
      '507f191e810c19729de860ea',
      GraphSyncOperation.UPSERT,
    );

    const [, parameters] = neo4j.executeWrite.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(parameters).toMatchObject({
      name: 'Quartier Centre',
      slug: 'quartier-centre',
      city: 'Paris',
    });
    expect(parameters).not.toHaveProperty('geometry');
  });

  it('creates HELPED only for a completed service and contract and remains replayable', async () => {
    const serviceModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439012',
            title: 'Aide terminée',
            category: 'Bricolage',
            status: 'completed',
            type: 'request',
            ownerId: 'requester-1',
            neighborhoodId: 'quartier-centre',
            completedAt: new Date('2026-07-20T10:00:00.000Z'),
          }),
        }),
      }),
    };
    const contractModel = {
      findOne: jest.fn().mockReturnValue(
        queryResult({
          _id: 'contract-1',
          requesterId: 'requester-1',
          providerId: 'provider-1',
          status: 'completed',
          completedAt: new Date('2026-07-20T10:00:00.000Z'),
        }),
      ),
    };
    const neighborhoodModel = {
      findOne: jest
        .fn()
        .mockReturnValue(queryResult({ _id: '507f191e810c19729de860ea' })),
    };
    const neo4j = {
      executeWrite: jest.fn().mockResolvedValue({ records: [] }),
    };
    const service = createProjection({
      serviceModel,
      contractModel,
      neighborhoodModel,
      neo4j,
    });

    await service.project(
      GraphEntityType.SERVICE,
      '507f1f77bcf86cd799439012',
      GraphSyncOperation.UPSERT,
    );
    await service.project(
      GraphEntityType.SERVICE,
      '507f1f77bcf86cd799439012',
      GraphSyncOperation.UPSERT,
    );

    const writeCalls = neo4j.executeWrite.mock.calls as unknown as Array<
      [string, Record<string, unknown>]
    >;
    const helpedCalls = writeCalls.filter(([cypher]) =>
      cypher.includes('MERGE (provider)-[helped:HELPED'),
    );
    expect(helpedCalls).toHaveLength(2);
    const parameters = helpedCalls[0]?.[1];
    expect(parameters).toMatchObject({
      contractId: 'contract-1',
      serviceId: '507f1f77bcf86cd799439012',
      providerId: 'provider-1',
      requesterId: 'requester-1',
    });
  });

  it('rebuilds public event participation without any vote data', async () => {
    const eventModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: 'event-1',
            title: 'Atelier vélo',
            category: 'workshop',
            status: 'open_registration',
            startsAt: new Date('2026-09-20T12:00:00.000Z'),
            organizerId: 'user-1',
            neighborhoodId: 'quartier-centre',
          }),
        }),
      }),
    };
    const responseModel = {
      find: jest.fn().mockReturnValue(
        queryResult([
          { userId: 'user-2', response: 'going' },
          { userId: 'user-3', response: 'interested' },
        ]),
      ),
    };
    const neighborhoodModel = {
      findOne: jest
        .fn()
        .mockReturnValue(queryResult({ _id: 'neighborhood-1' })),
    };
    const neo4j = {
      executeWrite: jest.fn().mockResolvedValue({ records: [] }),
    };
    const service = createProjection({
      eventModel,
      responseModel,
      neighborhoodModel,
      neo4j,
    });

    await service.project(
      GraphEntityType.EVENT,
      'event-1',
      GraphSyncOperation.UPSERT,
    );

    expect(neo4j.executeWrite).toHaveBeenCalledWith(
      expect.stringContaining('PARTICIPATED_IN'),
      { eventId: 'event-1', userIds: ['user-2'] },
    );
    expect(neo4j.executeWrite).toHaveBeenCalledWith(
      expect.stringContaining('INTERESTED_IN'),
      { eventId: 'event-1', userIds: ['user-3'] },
    );
    expect(JSON.stringify(neo4j.executeWrite.mock.calls)).not.toContain(
      'voteAnswer',
    );
  });

  it('removes hidden reviews and uses a parameterized relation for published reviews', async () => {
    const reviewModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: 'review-1',
            authorId: 'user-1',
            targetUserId: 'user-2',
            rating: 5,
            comment: 'Commentaire non projeté',
            status: 'published',
          }),
        }),
      }),
    };
    const neo4j = {
      executeWrite: jest.fn().mockResolvedValue({ records: [] }),
    };
    const service = createProjection({ reviewModel, neo4j });

    await service.project(
      GraphEntityType.REVIEW,
      'review-1',
      GraphSyncOperation.UPSERT,
    );

    expect(neo4j.executeWrite).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('DELETE reviewed'),
      { reviewId: 'review-1' },
    );
    const [, parameters] = neo4j.executeWrite.mock.calls[1] as [
      string,
      Record<string, unknown>,
    ];
    expect(parameters).toMatchObject({ rating: 5, reviewId: 'review-1' });
    expect(parameters).not.toHaveProperty('comment');
  });
});

function createProjection({
  userModel = {},
  neighborhoodModel = {},
  serviceModel = {},
  contractModel = {},
  eventModel = {},
  responseModel = {},
  reviewModel = {},
  neo4j = {},
}: Record<string, unknown>) {
  return new GraphProjectionService(
    userModel as never,
    neighborhoodModel as never,
    serviceModel as never,
    contractModel as never,
    eventModel as never,
    responseModel as never,
    reviewModel as never,
    neo4j as never,
  );
}
