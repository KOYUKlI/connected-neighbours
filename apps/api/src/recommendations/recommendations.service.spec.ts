import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { RecommendationsService } from './recommendations.service';

function queryResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(value),
      }),
    }),
  };
}

describe('RecommendationsService', () => {
  const actor: AuthenticatedUser = {
    sub: '507f1f77bcf86cd799439011',
    displayName: 'Alice Martin',
    email: 'alice@example.test',
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-centre',
  };
  const mongoServices = [
    {
      id: 'service-1',
      ownerId: 'owner-1',
      viewer: { hasApplied: false },
      title: 'Premier service',
      category: 'bricolage',
      owner: { reputationScore: 4.5 },
    },
    {
      id: 'service-2',
      ownerId: 'owner-2',
      viewer: { hasApplied: false },
      title: 'Deuxième service',
      category: 'animaux',
      owner: { reputationScore: 4 },
    },
  ];

  function createService(canAttempt: boolean, graphCandidates: unknown[] = []) {
    const userModel = {
      findOne: jest.fn().mockReturnValue(
        queryResult({
          _id: actor.sub,
          neighborhoodId: 'quartier-centre',
          interests: ['bricolage'],
          isActive: true,
        }),
      ),
    };
    const neighborhoodModel = {
      findOne: jest.fn().mockReturnValue(
        queryResult({
          _id: '507f191e810c19729de860ea',
          slug: 'quartier-centre',
          status: 'active',
        }),
      ),
    };
    const services = { findAll: jest.fn().mockResolvedValue(mongoServices) };
    const events = { discover: jest.fn().mockResolvedValue({ items: [] }) };
    const publicUsers = { findByIds: jest.fn().mockResolvedValue(new Map()) };
    const graph = {
      services: jest.fn().mockResolvedValue(graphCandidates),
      events: jest.fn().mockResolvedValue(graphCandidates),
      neighbors: jest.fn().mockResolvedValue(graphCandidates),
    };
    return {
      service: new RecommendationsService(
        userModel as never,
        neighborhoodModel as never,
        services as never,
        events as never,
        publicUsers as never,
        graph as never,
        { canAttempt } as never,
      ),
      graph,
      events,
      publicUsers,
    };
  }

  it('falls back deterministically to MongoDB when Neo4j is unavailable', async () => {
    const { service, graph } = createService(false);

    const result = await service.services(actor, { limit: 2, excludeIds: [] });

    expect(result.source).toBe('fallback');
    expect(result.items.map((item) => item.id)).toEqual([
      'service-1',
      'service-2',
    ]);
    expect(result.items[0]).not.toHaveProperty('score');
    expect(graph.services).not.toHaveBeenCalled();
  });

  it('uses graph order but intersects it with authorized MongoDB objects', async () => {
    const { service } = createService(true, [
      {
        id: 'forbidden-stale-service',
        score: 999,
        reasons: ['common_interest'],
      },
      {
        id: 'service-2',
        score: 75,
        reasons: ['same_neighborhood', 'common_interest'],
      },
    ]);

    const result = await service.services(actor, { limit: 2, excludeIds: [] });

    expect(result.source).toBe('graph');
    expect(result.items.map((item) => item.id)).toEqual([
      'service-2',
      'service-1',
    ]);
    expect(result.items[0].recommendationReason).toBe('Dans votre quartier');
    expect(
      result.items.some((item) => item.id === 'forbidden-stale-service'),
    ).toBe(false);
    expect(result.items[0]).not.toHaveProperty('score');
  });

  it('revalidates graph event identifiers against MongoDB discovery', async () => {
    const { service, events } = createService(true, [
      { id: 'event-stale', score: 100, reasons: ['same_neighborhood'] },
      { id: 'event-1', score: 50, reasons: ['known_participants'] },
    ]);
    events.discover.mockResolvedValue({
      items: [
        {
          id: 'event-1',
          category: 'bricolage',
          title: 'Atelier réparation',
          startsAt: '2026-08-01T10:00:00.000Z',
          counts: { participants: 4 },
        },
      ],
    });

    const result = await service.events(actor, { limit: 4, excludeIds: [] });

    expect(result.source).toBe('graph');
    expect(result.items.map((item) => item.id)).toEqual(['event-1']);
    expect(result.items[0].recommendationReason).toBe(
      'Des voisins connus y participent',
    );
    expect(result.items[0]).not.toHaveProperty('score');
  });

  it('keeps neighbor recommendations inside the public MongoDB candidate set', async () => {
    const userRows = [
      {
        _id: '507f1f77bcf86cd799439012',
        displayName: 'Bob Dupont',
        interests: ['bricolage'],
      },
      {
        _id: '507f1f77bcf86cd799439013',
        displayName: 'Claire Bernard',
        interests: ['animaux'],
      },
    ];
    const userModel = {
      findOne: jest.fn().mockReturnValue(
        queryResult({
          _id: actor.sub,
          neighborhoodId: 'quartier-centre',
          interests: ['bricolage'],
          isActive: true,
        }),
      ),
      find: jest.fn().mockReturnValue(listQueryResult(userRows)),
    };
    const neighborhoodModel = {
      findOne: jest.fn().mockReturnValue(
        queryResult({
          _id: '507f191e810c19729de860ea',
          slug: 'quartier-centre',
          status: 'active',
        }),
      ),
    };
    const profiles = new Map([
      [
        userRows[0]._id,
        {
          id: userRows[0]._id,
          displayName: userRows[0].displayName,
          reputationScore: 4.8,
        },
      ],
      [
        userRows[1]._id,
        {
          id: userRows[1]._id,
          displayName: userRows[1].displayName,
          reputationScore: 4.2,
        },
      ],
    ]);
    const graph = {
      neighbors: jest.fn().mockResolvedValue([
        { id: 'private-or-stale-user', score: 999, reasons: [] },
        { id: userRows[1]._id, score: 50, reasons: ['same_neighborhood'] },
      ]),
    };
    const service = new RecommendationsService(
      userModel as never,
      neighborhoodModel as never,
      { findAll: jest.fn() } as never,
      { discover: jest.fn() } as never,
      { findByIds: jest.fn().mockResolvedValue(profiles) } as never,
      graph as never,
      { canAttempt: true } as never,
    );

    const result = await service.neighbors(actor, {
      limit: 4,
      excludeIds: [],
    });

    expect(result.items.map((item) => item.id)).toEqual([
      userRows[1]._id,
      userRows[0]._id,
    ]);
    expect(result.items.some((item) => item.id === actor.sub)).toBe(false);
    expect(
      result.items.some((item) => item.id === 'private-or-stale-user'),
    ).toBe(false);
  });
});

function listQueryResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(value),
          }),
        }),
      }),
    }),
  };
}
