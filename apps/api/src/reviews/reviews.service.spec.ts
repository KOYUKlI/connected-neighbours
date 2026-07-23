import { ConflictException, ForbiddenException } from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { ServiceStatus } from '../services/schemas/service.schema';
import { ReviewsService } from './reviews.service';
import { ReviewStatus } from './schemas/review.schema';

const CONTRACT_ID = '507f1f77bcf86cd799439021';
const SERVICE_ID = '507f1f77bcf86cd799439022';
const ALICE_ID = '507f1f77bcf86cd799439011';
const BOB_ID = '507f1f77bcf86cd799439012';
const CLAIRE_ID = '507f1f77bcf86cd799439013';
const REVIEW_ID = '507f1f77bcf86cd799439023';

describe('ReviewsService', () => {
  let reviewModel: Record<string, jest.Mock>;
  let contractModel: Record<string, jest.Mock>;
  let serviceModel: Record<string, jest.Mock>;
  let userModel: Record<string, jest.Mock>;
  let storageService: Record<string, jest.Mock>;
  let service: ReviewsService;

  beforeEach(() => {
    reviewModel = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    contractModel = {
      findById: jest.fn(() => execResult(contractDocument())),
      find: jest.fn(),
    };
    serviceModel = {
      findById: jest.fn(() =>
        execResult({ id: SERVICE_ID, status: ServiceStatus.COMPLETED }),
      ),
      find: jest.fn(),
    };
    userModel = {
      findOne: jest.fn(() => selectableLeanResult({ _id: BOB_ID })),
      find: jest.fn(),
    };
    storageService = {
      getAvatarUrlsByFileIds: jest.fn().mockResolvedValue(new Map()),
    };
    service = new ReviewsService(
      reviewModel as never,
      contractModel as never,
      serviceModel as never,
      userModel as never,
      { getOne: jest.fn() } as never,
      storageService as never,
    );
    mockPresentationQueries();
  });

  it('lets the requester review the provider and derives the target server-side', async () => {
    const review = reviewDocument();
    reviewModel.create.mockResolvedValue(review);

    const result = await service.create(
      CONTRACT_ID,
      { rating: 5, comment: '  Très bon service.  ' },
      actor(ALICE_ID),
    );

    expect(reviewModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: ALICE_ID,
        targetUserId: BOB_ID,
        rating: 5,
        comment: 'Très bon service.',
      }),
    );
    expect(result.rating).toBe(5);
  });

  it('lets the provider review the requester', async () => {
    reviewModel.create.mockResolvedValue(
      reviewDocument({ authorId: BOB_ID, targetUserId: ALICE_ID }),
    );
    userModel.findOne.mockReturnValue(selectableLeanResult({ _id: ALICE_ID }));

    await service.create(
      CONTRACT_ID,
      { rating: 4, comment: 'Bonne organisation.' },
      actor(BOB_ID),
    );

    expect(reviewModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: BOB_ID, targetUserId: ALICE_ID }),
    );
  });

  it('rejects a third party and a contract that is not completed', async () => {
    await expect(
      service.create(CONTRACT_ID, { rating: 4, comment: '' }, actor(CLAIRE_ID)),
    ).rejects.toBeInstanceOf(ForbiddenException);

    contractModel.findById.mockReturnValue(
      execResult(contractDocument({ status: ContractStatus.ACTIVE })),
    );
    await expect(
      service.create(CONTRACT_ID, { rating: 4, comment: '' }, actor(ALICE_ID)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects self-review and a service that is not completed', async () => {
    contractModel.findById.mockReturnValue(
      execResult(
        contractDocument({ requesterId: ALICE_ID, providerId: ALICE_ID }),
      ),
    );
    await expect(
      service.create(CONTRACT_ID, { rating: 5, comment: '' }, actor(ALICE_ID)),
    ).rejects.toBeInstanceOf(ForbiddenException);

    contractModel.findById.mockReturnValue(execResult(contractDocument()));
    serviceModel.findById.mockReturnValue(
      execResult({ id: SERVICE_ID, status: ServiceStatus.IN_PROGRESS }),
    );
    await expect(
      service.create(CONTRACT_ID, { rating: 5, comment: '' }, actor(ALICE_ID)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('turns the unique index violation into a business conflict', async () => {
    reviewModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.create(CONTRACT_ID, { rating: 5, comment: '' }, actor(ALICE_ID)),
    ).rejects.toThrow('déjà publié');
  });

  it('allows one reply from the target and rejects a second reply', async () => {
    const review = reviewDocument();
    reviewModel.findById.mockReturnValue(execResult(review));

    await service.reply(REVIEW_ID, ' Merci ! ', actor(BOB_ID));
    expect(review.response?.message).toBe('Merci !');
    expect(review.save).toHaveBeenCalledTimes(1);

    await expect(
      service.reply(REVIEW_ID, 'Encore merci', actor(BOB_ID)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a reply from the author or a third party', async () => {
    const review = reviewDocument();
    reviewModel.findById.mockReturnValue(execResult(review));

    await expect(
      service.reply(REVIEW_ID, 'Auteur', actor(ALICE_ID)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.reply(REVIEW_ID, 'Tiers', actor(CLAIRE_ID)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows moderation without deleting the review', async () => {
    const review = reviewDocument();
    reviewModel.findById.mockReturnValue(execResult(review));

    const result = await service.hide(
      REVIEW_ID,
      'Contenu inapproprié',
      actor('507f1f77bcf86cd799439099', Role.MODERATOR),
    );

    expect(result.status).toBe(ReviewStatus.HIDDEN);
    expect(review.save).toHaveBeenCalled();
    expect(reviewModel).not.toHaveProperty('deleteOne');
  });

  it('rejects resident moderation and preserves hide/restore history', async () => {
    const review = reviewDocument();
    reviewModel.findById.mockReturnValue(execResult(review));

    await expect(
      service.hide(REVIEW_ID, 'Motif', actor(ALICE_ID)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await service.hide(
      REVIEW_ID,
      'Masquage justifié',
      actor('507f1f77bcf86cd799439099', Role.MODERATOR),
    );
    const restored = await service.restore(
      REVIEW_ID,
      'Restauration justifiée',
      actor('507f1f77bcf86cd799439099', Role.ADMIN),
    );

    expect(restored.status).toBe(ReviewStatus.PUBLISHED);
    expect(review.moderationHistory).toHaveLength(2);
  });

  function mockPresentationQueries() {
    userModel.find.mockReturnValue(
      selectableLeanResult([
        {
          _id: ALICE_ID,
          displayName: 'Alice',
          avatarFileId: null,
          isActive: true,
        },
        { _id: BOB_ID, displayName: 'Bob', avatarFileId: null, isActive: true },
      ]),
    );
    serviceModel.find.mockReturnValue(
      selectableLeanResult([
        {
          _id: SERVICE_ID,
          title: 'Service',
          category: 'Aide',
          status: ServiceStatus.COMPLETED,
        },
      ]),
    );
  }
});

function actor(sub: string, role = Role.RESIDENT) {
  return {
    sub,
    email: 'user@example.test',
    displayName: 'User',
    neighborhoodId: 'quartier-centre',
    role,
  };
}

function contractDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: CONTRACT_ID,
    serviceId: SERVICE_ID,
    requesterId: ALICE_ID,
    providerId: BOB_ID,
    status: ContractStatus.COMPLETED,
    ...overrides,
  };
}

function reviewDocument(overrides: Record<string, unknown> = {}) {
  const value = {
    id: REVIEW_ID,
    _id: REVIEW_ID,
    contractId: CONTRACT_ID,
    serviceId: SERVICE_ID,
    authorId: ALICE_ID,
    targetUserId: BOB_ID,
    rating: 5,
    comment: 'Très bon service.',
    status: ReviewStatus.PUBLISHED,
    response: null as {
      authorId: string;
      message: string;
      respondedAt: Date;
    } | null,
    moderationHistory: [] as Array<Record<string, unknown>>,
    moderatedById: null as string | null,
    moderatedAt: null as Date | null,
    moderationReason: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(function save(this: unknown) {
      return Promise.resolve(this);
    }),
    ...overrides,
  };
  const document = {
    ...value,
    toObject: () => ({ ...document }),
  };
  return document;
}

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
