import { NotFoundException } from '@nestjs/common';

import { ProfileVisibility } from '../auth/schemas/user.schema';
import { PublicUsersService } from './public-users.service';

const ALICE_ID = '507f1f77bcf86cd799439011';

describe('PublicUsersService', () => {
  const userModel = { find: jest.fn() };
  const reputationService = { getSummariesByUserIds: jest.fn() };
  const storageService = { getAvatarUrlsByFileIds: jest.fn() };
  let service: PublicUsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    reputationService.getSummariesByUserIds.mockResolvedValue(new Map());
    storageService.getAvatarUrlsByFileIds.mockResolvedValue(new Map());
    service = new PublicUsersService(
      userModel as never,
      reputationService as never,
      storageService as never,
    );
  });

  it('returns only the minimal public projection', async () => {
    userModel.find.mockReturnValue(
      selectableLeanResult([
        {
          _id: ALICE_ID,
          displayName: 'Alice Martin',
          neighborhoodId: 'quartier-centre',
          avatarFileId: null,
          profileVisibility: ProfileVisibility.NEIGHBORHOOD,
          showReputation: true,
          showCompletedServices: true,
          email: 'alice@connected-neighbours.local',
          passwordHash: 'secret',
          pointsBalance: 100,
        },
      ]),
    );
    reputationService.getSummariesByUserIds.mockResolvedValue(
      new Map([
        [
          ALICE_ID,
          {
            averageRating: 4.5,
            reviewCount: 2,
            reputationScore: 87,
            completedServicesCount: 2,
          },
        ],
      ]),
    );

    const profile = await service.findOne(ALICE_ID);

    expect(profile).toEqual({
      id: ALICE_ID,
      displayName: 'Alice Martin',
      avatarUrl: null,
      neighborhoodId: 'quartier-centre',
      reputationScore: 87,
      averageRating: 4.5,
      reviewCount: 2,
      completedServicesCount: 2,
    });
    expect(profile).not.toHaveProperty('email');
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('pointsBalance');
  });

  it('does not expose reputation statistics for a private profile', async () => {
    userModel.find.mockReturnValue(
      selectableLeanResult([
        {
          _id: ALICE_ID,
          displayName: 'Alice Martin',
          neighborhoodId: 'quartier-centre',
          avatarFileId: null,
          profileVisibility: ProfileVisibility.PRIVATE,
          showReputation: true,
          showCompletedServices: true,
        },
      ]),
    );
    reputationService.getSummariesByUserIds.mockResolvedValue(
      new Map([
        [
          ALICE_ID,
          {
            averageRating: 5,
            reviewCount: 1,
            reputationScore: 83,
            completedServicesCount: 1,
          },
        ],
      ]),
    );

    const profile = await service.findOne(ALICE_ID);

    expect(profile.reputationScore).toBeNull();
    expect(profile.averageRating).toBeNull();
    expect(profile.reviewCount).toBe(0);
    expect(profile.completedServicesCount).toBe(0);
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
