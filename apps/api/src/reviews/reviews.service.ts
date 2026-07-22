import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType } from '../graph/graph.types';
import {
  ProfileVisibility,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { StorageService } from '../storage/storage.service';
import { AdminListReviewsQueryDto } from './dto/admin-list-reviews-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import { ReputationService } from './reputation.service';

type ReviewRow = Review & { _id: unknown; createdAt?: Date; updatedAt?: Date };
type UserRow = Pick<
  User,
  | 'displayName'
  | 'avatarFileId'
  | 'isActive'
  | 'neighborhoodId'
  | 'profileVisibility'
  | 'showReviews'
  | 'showReputation'
> & { _id: unknown };
type ServiceRow = Pick<Service, 'title' | 'category' | 'status'> & {
  _id: unknown;
};

export type ContractReviewPermission = {
  canReview: boolean;
  hasReviewed: boolean;
  reviewId: string | null;
  otherPartyId: string | null;
};

const MODERATION_ROLES = new Set([Role.ADMIN, Role.MODERATOR]);

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly reputationService: ReputationService,
    private readonly storageService: StorageService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async create(
    contractId: string,
    dto: CreateReviewDto,
    actor: AuthenticatedUser,
  ) {
    const contract = await this.findContract(contractId);
    const targetUserId = this.resolveTarget(contract, actor.sub);
    if (targetUserId === actor.sub) {
      throw new ForbiddenException(
        'Vous ne pouvez pas publier un avis sur votre propre compte.',
      );
    }
    if (contract.status !== ContractStatus.COMPLETED) {
      throw new ConflictException(
        'Le contrat doit être terminé avant de publier un avis.',
      );
    }
    const service = await this.serviceModel.findById(contract.serviceId).exec();
    if (!service || service.status !== ServiceStatus.COMPLETED) {
      throw new ConflictException(
        'Le service doit être terminé avant de publier un avis.',
      );
    }
    const target = await this.userModel
      .findOne({ _id: targetUserId, isActive: true })
      .select('_id')
      .lean()
      .exec();
    if (!target) {
      throw new ConflictException(
        'La personne évaluée ne peut plus recevoir d’avis.',
      );
    }

    try {
      const review = await this.reviewModel.create({
        contractId: contract.id,
        serviceId: contract.serviceId,
        authorId: actor.sub,
        targetUserId,
        rating: dto.rating,
        comment: this.cleanText(dto.comment),
        status: ReviewStatus.PUBLISHED,
        response: null,
        moderationHistory: [],
        moderatedById: null,
        moderatedAt: null,
        moderationReason: null,
      });
      this.queueReviewProjection(review.id, targetUserId);
      return this.presentOne(review.toObject() as ReviewRow, actor);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          'Vous avez déjà publié un avis pour ce contrat.',
        );
      }
      throw error;
    }
  }

  async reply(reviewId: string, message: string, actor: AuthenticatedUser) {
    const review = await this.findReview(reviewId);
    if (review.targetUserId !== actor.sub) {
      throw new ForbiddenException(
        'Seule la personne évaluée peut répondre à cet avis.',
      );
    }
    if (review.status !== ReviewStatus.PUBLISHED) {
      throw new ConflictException('Cet avis n’est pas publié.');
    }
    if (review.response) {
      throw new ConflictException('Une réponse existe déjà pour cet avis.');
    }
    review.response = {
      authorId: actor.sub,
      message: this.requireText(message, 'Une réponse est requise.'),
      respondedAt: new Date(),
    };
    await review.save();
    return this.presentOne(review.toObject() as ReviewRow, actor);
  }

  async listForUser(
    userId: string,
    query: ListReviewsQueryDto,
    actor: AuthenticatedUser,
  ) {
    const target = await this.findVisibleTarget(userId, actor);
    if (!target || !target.isActive)
      throw new NotFoundException('Profil public introuvable.');
    const filter: Record<string, unknown> = {
      targetUserId: userId,
      status: ReviewStatus.PUBLISHED,
    };
    if (query.rating) filter.rating = query.rating;
    const sort: Record<string, 1 | -1> =
      query.sort === 'oldest'
        ? { createdAt: 1 as const }
        : query.sort === 'rating_desc'
          ? { rating: -1 as const, createdAt: -1 as const }
          : { createdAt: -1 as const };
    const [rows, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<ReviewRow[]>()
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);
    return {
      items: await this.presentMany(rows, actor),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async listMine(
    direction: 'given' | 'received',
    query: ListReviewsQueryDto,
    actor: AuthenticatedUser,
  ) {
    const field = direction === 'given' ? 'authorId' : 'targetUserId';
    const filter: Record<string, unknown> = { [field]: actor.sub };
    if (query.rating) filter.rating = query.rating;
    const [rows, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: query.sort === 'oldest' ? 1 : -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<ReviewRow[]>()
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);
    return {
      items: await this.presentMany(rows, actor),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async findOne(reviewId: string, actor: AuthenticatedUser) {
    const review = await this.findReview(reviewId);
    const canViewHidden =
      review.status === ReviewStatus.PUBLISHED ||
      review.authorId === actor.sub ||
      review.targetUserId === actor.sub ||
      MODERATION_ROLES.has(actor.role);
    if (!canViewHidden) throw new NotFoundException('Avis introuvable.');
    return this.presentOne(review.toObject() as ReviewRow, actor);
  }

  async getPermissionsByContractIds(
    contractIds: string[],
    actor: AuthenticatedUser,
  ) {
    const uniqueIds = [...new Set(contractIds.filter(Boolean))];
    if (uniqueIds.length === 0)
      return new Map<string, ContractReviewPermission>();
    const [contracts, reviews] = await Promise.all([
      this.contractModel
        .find({ _id: { $in: uniqueIds } })
        .select('_id requesterId providerId status serviceId')
        .lean<
          Array<
            Pick<
              Contract,
              'requesterId' | 'providerId' | 'status' | 'serviceId'
            > & { _id: unknown }
          >
        >()
        .exec(),
      this.reviewModel
        .find({ contractId: { $in: uniqueIds }, authorId: actor.sub })
        .select('_id contractId')
        .lean<Array<{ _id: unknown; contractId: string }>>()
        .exec(),
    ]);
    const serviceIds = [
      ...new Set(contracts.map((contract) => contract.serviceId)),
    ];
    const completedServices = await this.serviceModel
      .find({ _id: { $in: serviceIds }, status: ServiceStatus.COMPLETED })
      .select('_id')
      .lean<Array<{ _id: unknown }>>()
      .exec();
    const completedServiceIds = new Set(
      completedServices.map((service) => String(service._id)),
    );
    const reviewByContract = new Map(
      reviews.map((review) => [review.contractId, String(review._id)]),
    );
    return new Map(
      contracts.map((contract) => {
        const id = String(contract._id);
        const isParty =
          contract.requesterId === actor.sub ||
          contract.providerId === actor.sub;
        const otherPartyId =
          contract.requesterId === actor.sub
            ? contract.providerId
            : contract.providerId === actor.sub
              ? contract.requesterId
              : null;
        const reviewId = reviewByContract.get(id) ?? null;
        return [
          id,
          {
            canReview:
              isParty &&
              contract.status === ContractStatus.COMPLETED &&
              completedServiceIds.has(contract.serviceId) &&
              !reviewId,
            hasReviewed: Boolean(reviewId),
            reviewId,
            otherPartyId,
          },
        ];
      }),
    );
  }

  async adminList(query: AdminListReviewsQueryDto, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.rating) filter.rating = query.rating;
    if (query.search?.trim()) {
      const pattern = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      const [users, services] = await Promise.all([
        this.userModel
          .find({ displayName: pattern })
          .select('_id')
          .lean<Array<{ _id: unknown }>>()
          .exec(),
        this.serviceModel
          .find({ title: pattern })
          .select('_id')
          .lean<Array<{ _id: unknown }>>()
          .exec(),
      ]);
      filter.$or = [
        { comment: pattern },
        { authorId: { $in: users.map((user) => String(user._id)) } },
        { targetUserId: { $in: users.map((user) => String(user._id)) } },
        { serviceId: { $in: services.map((service) => String(service._id)) } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<ReviewRow[]>()
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);
    return {
      items: await this.presentMany(rows, actor),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async hide(reviewId: string, reason: string, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const review = await this.findReview(reviewId);
    if (review.status === ReviewStatus.HIDDEN)
      return this.presentOne(review.toObject() as ReviewRow, actor);
    const cleanReason = this.requireText(reason, 'Une raison est requise.');
    const now = new Date();
    review.status = ReviewStatus.HIDDEN;
    review.moderatedById = actor.sub;
    review.moderatedAt = now;
    review.moderationReason = cleanReason;
    review.moderationHistory.push({
      action: 'hidden',
      moderatorId: actor.sub,
      reason: cleanReason,
      createdAt: now,
    });
    await review.save();
    this.queueReviewProjection(review.id, review.targetUserId);
    return this.presentOne(review.toObject() as ReviewRow, actor);
  }

  async restore(reviewId: string, reason: string, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const review = await this.findReview(reviewId);
    if (review.status === ReviewStatus.PUBLISHED)
      return this.presentOne(review.toObject() as ReviewRow, actor);
    const cleanReason = this.requireText(reason, 'Une raison est requise.');
    const now = new Date();
    review.status = ReviewStatus.PUBLISHED;
    review.moderatedById = actor.sub;
    review.moderatedAt = now;
    review.moderationReason = cleanReason;
    review.moderationHistory.push({
      action: 'restored',
      moderatorId: actor.sub,
      reason: cleanReason,
      createdAt: now,
    });
    await review.save();
    this.queueReviewProjection(review.id, review.targetUserId);
    return this.presentOne(review.toObject() as ReviewRow, actor);
  }

  private queueReviewProjection(reviewId: string, targetUserId: string) {
    void this.graphSyncService?.enqueue(GraphEntityType.REVIEW, reviewId);
    void this.graphSyncService?.enqueue(GraphEntityType.USER, targetUserId);
  }

  async reputation(userId: string, actor: AuthenticatedUser) {
    if (!Types.ObjectId.isValid(userId))
      throw new NotFoundException('Profil public introuvable.');
    const user = await this.userModel
      .findOne({ _id: userId, isActive: true })
      .select('_id neighborhoodId profileVisibility showReputation')
      .lean<UserRow>()
      .exec();
    if (!user) throw new NotFoundException('Profil public introuvable.');
    const expanded =
      actor.sub === userId ||
      MODERATION_ROLES.has(actor.role) ||
      (user.profileVisibility === ProfileVisibility.NEIGHBORHOOD &&
        user.neighborhoodId === actor.neighborhoodId);
    if (!expanded || !user.showReputation) {
      throw new ForbiddenException('La réputation de ce profil est privée.');
    }
    return this.reputationService.getOne(userId);
  }

  private async presentOne(row: ReviewRow, actor: AuthenticatedUser) {
    const [item] = await this.presentMany([row], actor);
    return item;
  }

  private async presentMany(rows: ReviewRow[], actor: AuthenticatedUser) {
    if (rows.length === 0) return [];
    const userIds = [
      ...new Set(rows.flatMap((row) => [row.authorId, row.targetUserId])),
    ];
    const [users, services] = await Promise.all([
      this.userModel
        .find({ _id: { $in: userIds } })
        .select('_id displayName avatarFileId isActive')
        .lean<UserRow[]>()
        .exec(),
      this.serviceModel
        .find({ _id: { $in: rows.map((row) => row.serviceId) } })
        .select('_id title category status')
        .lean<ServiceRow[]>()
        .exec(),
    ]);
    const avatarUrls = await this.storageService.getAvatarUrlsByFileIds(
      users
        .map((user) => user.avatarFileId)
        .filter((id): id is string => Boolean(id)),
    );
    const userMap = new Map(
      users.map((user) => [
        String(user._id),
        {
          id: String(user._id),
          displayName: user.displayName,
          avatarUrl: user.avatarFileId
            ? (avatarUrls.get(user.avatarFileId) ?? null)
            : null,
        },
      ]),
    );
    const serviceMap = new Map(
      services.map((service) => [
        String(service._id),
        {
          id: String(service._id),
          title: service.title,
          category: service.category,
          status: service.status,
        },
      ]),
    );
    return rows.map((row) => ({
      id: String(row._id),
      contractId: row.contractId,
      serviceId: row.serviceId,
      rating: row.rating,
      comment: row.comment,
      status: row.status,
      response: row.response,
      moderationReason:
        MODERATION_ROLES.has(actor.role) ||
        row.authorId === actor.sub ||
        row.targetUserId === actor.sub
          ? row.moderationReason
          : null,
      moderationHistory: MODERATION_ROLES.has(actor.role)
        ? row.moderationHistory
        : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: userMap.get(row.authorId) ?? null,
      targetUser: userMap.get(row.targetUserId) ?? null,
      service: serviceMap.get(row.serviceId) ?? null,
      permissions: {
        canReply:
          row.targetUserId === actor.sub &&
          row.status === ReviewStatus.PUBLISHED &&
          !row.response,
        canModerate: MODERATION_ROLES.has(actor.role),
      },
    }));
  }

  private async findVisibleTarget(userId: string, actor: AuthenticatedUser) {
    if (!Types.ObjectId.isValid(userId)) return null;
    const target = await this.userModel
      .findById(userId)
      .select('_id isActive neighborhoodId profileVisibility showReviews')
      .lean<UserRow>()
      .exec();
    if (!target) return null;
    const expanded =
      actor.sub === userId ||
      MODERATION_ROLES.has(actor.role) ||
      (target.profileVisibility === ProfileVisibility.NEIGHBORHOOD &&
        target.neighborhoodId === actor.neighborhoodId);
    if (!expanded || !target.showReviews) {
      throw new ForbiddenException('Les avis de ce profil sont privés.');
    }
    return target;
  }

  private resolveTarget(contract: ContractDocument, actorId: string) {
    if (contract.requesterId === actorId) return contract.providerId;
    if (contract.providerId === actorId) return contract.requesterId;
    throw new ForbiddenException(
      'Seules les parties au contrat peuvent publier un avis.',
    );
  }

  private async findContract(contractId: string) {
    if (!Types.ObjectId.isValid(contractId))
      throw new NotFoundException('Contrat introuvable.');
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    return contract;
  }

  private async findReview(reviewId: string) {
    if (!Types.ObjectId.isValid(reviewId))
      throw new NotFoundException('Avis introuvable.');
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) throw new NotFoundException('Avis introuvable.');
    return review;
  }

  private assertModerator(actor: AuthenticatedUser) {
    if (!MODERATION_ROLES.has(actor.role))
      throw new ForbiddenException('Accès réservé à la modération.');
  }

  private cleanText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private requireText(value: string, message: string) {
    const clean = this.cleanText(value);
    if (!clean) throw new ConflictException(message);
    return clean;
  }

  private escapeRegex(value: string) {
    return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}
