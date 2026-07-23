import neo4j from 'neo4j-driver';

import { GraphRecommendationQueryService } from './graph-recommendation-query.service';

describe('GraphRecommendationQueryService', () => {
  it('sends LIMIT as a Neo4j integer and returns only ranking metadata', async () => {
    const executeRead = jest.fn().mockResolvedValue({
      records: [
        {
          get: jest.fn((key: string) => {
            if (key === 'id') return 'service-1';
            if (key === 'score') return neo4j.int(75);
            if (key === 'reasons') {
              return ['same_neighborhood', 'common_interest'];
            }
            return null;
          }),
        },
      ],
    });
    const service = new GraphRecommendationQueryService({
      executeRead,
    } as never);

    const result = await service.services({
      userId: 'user-1',
      neighborhoodMongoId: 'neighborhood-1',
      interests: ['bricolage'],
      excludeIds: [],
      limit: 6,
    });

    const calls = executeRead.mock.calls as unknown as Array<
      [string, Record<string, unknown>]
    >;
    const parameters = calls[0]?.[1];
    expect(neo4j.isInt(parameters.limit)).toBe(true);
    expect(result).toEqual([
      {
        id: 'service-1',
        score: 75,
        reasons: ['same_neighborhood', 'common_interest'],
      },
    ]);
  });
});
