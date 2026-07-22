import { ReputationService } from './reputation.service';

describe('ReputationService', () => {
  const reviewModel = { aggregate: jest.fn() };
  const contractModel = { aggregate: jest.fn() };
  let service: ReputationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReputationService(
      reviewModel as never,
      contractModel as never,
    );
  });

  it('returns null averages and score when no published review exists', async () => {
    reviewModel.aggregate.mockReturnValue(execResult([]));
    contractModel.aggregate.mockReturnValue(execResult([]));

    const result = await service.getOne('alice');

    expect(result.averageRating).toBeNull();
    expect(result.reputationScore).toBeNull();
    expect(result.reviewCount).toBe(0);
    expect(result.ratingDistribution).toEqual({
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    });
  });

  it('calculates the exact distribution, mean and Bayesian score', async () => {
    reviewModel.aggregate.mockReturnValue(
      execResult([
        {
          _id: 'bob',
          reviewCount: 3,
          sumRatings: 13,
          rating1: 0,
          rating2: 0,
          rating3: 0,
          rating4: 2,
          rating5: 1,
        },
      ]),
    );
    contractModel.aggregate.mockReturnValue(
      execResult([{ _id: 'bob', count: 2 }]),
    );

    const result = await service.getOne('bob');

    expect(result.averageRating).toBe(4.33);
    expect(result.reputationScore).toBe(83);
    expect(result.completedServicesCount).toBe(2);
    expect(result.ratingDistribution).toEqual({
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 2,
      '5': 1,
    });
  });

  it('groups several users in two aggregation calls', async () => {
    reviewModel.aggregate.mockReturnValue(
      execResult([
        {
          _id: 'alice',
          reviewCount: 1,
          sumRatings: 5,
          rating1: 0,
          rating2: 0,
          rating3: 0,
          rating4: 0,
          rating5: 1,
        },
      ]),
    );
    contractModel.aggregate.mockReturnValue(
      execResult([
        { _id: 'alice', count: 1 },
        { _id: 'bob', count: 3 },
      ]),
    );

    const result = await service.getSummariesByUserIds([
      'alice',
      'bob',
      'alice',
    ]);

    expect(result.size).toBe(2);
    expect(result.get('bob')?.reviewCount).toBe(0);
    expect(result.get('bob')?.completedServicesCount).toBe(3);
    expect(reviewModel.aggregate).toHaveBeenCalledTimes(1);
    expect(contractModel.aggregate).toHaveBeenCalledTimes(1);
    expect(reviewModel.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          $match: {
            targetUserId: { $in: ['alice', 'bob'] },
            status: 'published',
          },
        },
      ]),
    );
  });
});

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}
