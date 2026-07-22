import { ForbiddenException } from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { ProfileVisibility } from '../auth/schemas/user.schema';
import { UserProfilesService } from './user-profiles.service';

const ALICE_ID = '507f1f77bcf86cd799439011';
const BOB_ID = '507f1f77bcf86cd799439012';

describe('UserProfilesService', () => {
  const userModel = { findOne: jest.fn() };
  const serviceModel = { find: jest.fn() };
  const neighborhoodModel = {
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        name: 'Quartier Centre',
        city: 'Paris',
      }),
    }),
  };
  const storageService = {
    getAvatarUrlsByFileIds: jest.fn().mockResolvedValue(new Map()),
    findFile: jest.fn(),
    completeUpload: jest.fn(),
    removeOrphan: jest.fn().mockResolvedValue(undefined),
  };
  const reputationService = {
    getOne: jest.fn().mockResolvedValue({
      averageRating: null,
      reviewCount: 0,
      completedServicesCount: 0,
      reputationScore: null,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      calculatedAt: new Date().toISOString(),
    }),
  };
  const reviewsService = {
    listForUser: jest.fn().mockResolvedValue({
      items: [],
      page: 1,
      limit: 5,
      total: 0,
    }),
  };
  let service: UserProfilesService;

  beforeEach(() => {
    jest.clearAllMocks();
    storageService.getAvatarUrlsByFileIds.mockResolvedValue(new Map());
    storageService.removeOrphan.mockResolvedValue(undefined);
    service = new UserProfilesService(
      userModel as never,
      serviceModel as never,
      neighborhoodModel as never,
      storageService as never,
      reputationService as never,
      reviewsService as never,
    );
  });

  it('updates only profile fields and normalizes interests', async () => {
    const user = userDocument();
    userModel.findOne.mockReturnValue(execResult(user));

    const result = await service.updateMe(
      {
        displayName: ' Alice Martin ',
        bio: ' Nouvelle bio ',
        interests: [' Bricolage ', 'Bricolage', ' Jardinage '],
      },
      actor(ALICE_ID),
    );

    expect(user.displayName).toBe('Alice Martin');
    expect(user.bio).toBe('Nouvelle bio');
    expect(user.interests).toEqual(['Bricolage', 'Jardinage']);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('role');
    expect(result).not.toHaveProperty('pointsBalance');
  });

  it('returns only the minimal projection of a private profile to a third party', async () => {
    const user = userDocument({
      id: BOB_ID,
      _id: BOB_ID,
      profileVisibility: ProfileVisibility.PRIVATE,
      bio: 'Bio privée',
    });
    userModel.findOne.mockReturnValue(execResult(user));

    const result = await service.getPublicProfile(BOB_ID, actor(ALICE_ID));

    expect(result.isRestricted).toBe(true);
    expect(result).not.toHaveProperty('bio');
    expect(result).not.toHaveProperty('interests');
    expect(result).not.toHaveProperty('neighborhoodId');
  });

  it('refuses associating an avatar owned by another user', async () => {
    const avatarService = new UserProfilesService(
      userModel as never,
      serviceModel as never,
      neighborhoodModel as never,
      {
        ...storageService,
        findFile: jest.fn().mockResolvedValue({
          ownerId: BOB_ID,
          contextId: BOB_ID,
          contextType: 'user_avatar',
        }),
      } as never,
      reputationService as never,
      reviewsService as never,
    );

    await expect(
      avatarService.completeAvatar('507f1f77bcf86cd799439099', actor(ALICE_ID)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('replaces an avatar only after verification and removes the former object', async () => {
    const oldAvatarId = '507f1f77bcf86cd799439090';
    const newAvatarId = '507f1f77bcf86cd799439091';
    const user = userDocument({ avatarFileId: oldAvatarId });
    userModel.findOne.mockReturnValue(execResult(user));
    storageService.findFile.mockResolvedValue({
      ownerId: ALICE_ID,
      contextId: ALICE_ID,
      contextType: 'user_avatar',
    });
    storageService.completeUpload.mockResolvedValue({ status: 'verified' });

    await service.completeAvatar(newAvatarId, actor(ALICE_ID));

    expect(user.avatarFileId).toBe(newAvatarId);
    expect(storageService.removeOrphan).toHaveBeenCalledWith(oldAvatarId);
  });

  it('removes an avatar idempotently', async () => {
    const avatarId = '507f1f77bcf86cd799439090';
    const user = userDocument({ avatarFileId: avatarId });
    userModel.findOne.mockReturnValue(execResult(user));

    await service.removeAvatar(actor(ALICE_ID));
    await service.removeAvatar(actor(ALICE_ID));

    expect(user.avatarFileId).toBeNull();
    expect(storageService.removeOrphan).toHaveBeenCalledTimes(1);
  });
});

function actor(sub: string) {
  return {
    sub,
    email: 'alice@example.test',
    displayName: 'Alice',
    neighborhoodId: 'quartier-centre',
    role: Role.RESIDENT,
  };
}

function userDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: ALICE_ID,
    _id: ALICE_ID,
    email: 'alice@example.test',
    displayName: 'Alice',
    neighborhoodId: 'quartier-centre',
    passwordHash: 'secret',
    role: Role.RESIDENT,
    pointsBalance: 100,
    reservedPoints: 0,
    isActive: true,
    bio: '',
    interests: [] as string[],
    avatarFileId: null as string | null,
    profileVisibility: ProfileVisibility.NEIGHBORHOOD,
    showNeighborhood: true,
    showReviews: true,
    showCompletedServices: true,
    showReputation: true,
    profileUpdatedAt: null as Date | null,
    save: jest.fn(function save(this: unknown) {
      return Promise.resolve(this);
    }),
    ...overrides,
  };
}

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}
