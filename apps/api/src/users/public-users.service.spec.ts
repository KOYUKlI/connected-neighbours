import { NotFoundException } from '@nestjs/common';

import { PublicUsersService } from './public-users.service';

const ALICE_ID = '507f1f77bcf86cd799439011';

describe('PublicUsersService', () => {
  const userModel = { find: jest.fn() };
  const serviceModel = { aggregate: jest.fn() };
  let service: PublicUsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublicUsersService(userModel as never, serviceModel as never);
  });

  it('returns only the minimal public projection', async () => {
    userModel.find.mockReturnValue(
      selectableLeanResult([
        {
          _id: ALICE_ID,
          displayName: 'Alice Martin',
          neighborhoodId: 'quartier-centre',
          email: 'alice@connected-neighbours.local',
          passwordHash: 'secret',
          pointsBalance: 100,
        },
      ]),
    );
    serviceModel.aggregate.mockReturnValue(
      execResult([{ _id: ALICE_ID, count: 2 }]),
    );

    const profile = await service.findOne(ALICE_ID);

    expect(profile).toEqual({
      id: ALICE_ID,
      displayName: 'Alice Martin',
      avatarUrl: null,
      neighborhoodId: 'quartier-centre',
      reputationScore: null,
      completedServicesCount: 2,
    });
    expect(profile).not.toHaveProperty('email');
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('pointsBalance');
  });

  it('returns 404 for an invalid identifier without querying MongoDB', async () => {
    await expect(service.findOne('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(userModel.find).not.toHaveBeenCalled();
  });
});

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function selectableLeanResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue(execResult(value)),
    }),
  };
}
