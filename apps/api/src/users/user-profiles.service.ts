import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  ProfileVisibility,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType } from '../graph/graph.types';
import {
  Neighborhood,
  NeighborhoodDocument,
} from '../neighborhoods/schemas/neighborhood.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { ReputationService } from '../reviews/reputation.service';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { PresignAvatarUploadDto } from '../storage/dto/presign-avatar-upload.dto';
import {
  StorageContextType,
  StorageFileStatus,
} from '../storage/schemas/storage-file.schema';
import { StorageService } from '../storage/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    private readonly storageService: StorageService,
    private readonly reputationService: ReputationService,
    private readonly reviewsService: ReviewsService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async getMe(actor: AuthenticatedUser) {
    const user = await this.findUser(actor.sub);
    return this.presentOwnProfile(user);
  }

  async updateMe(dto: UpdateProfileDto, actor: AuthenticatedUser) {
    const user = await this.findUser(actor.sub);
    if (dto.displayName !== undefined) {
      const displayName = this.cleanText(dto.displayName);
      if (!displayName)
        throw new BadRequestException('Le nom public est requis.');
      user.displayName = displayName;
    }
    if (dto.bio !== undefined) user.bio = dto.bio.trim();
    if (dto.interests !== undefined) {
      const interests = [
        ...new Set(
          dto.interests.map((value) => this.cleanText(value)).filter(Boolean),
        ),
      ];
      if (interests.length > 12) {
        throw new BadRequestException('Douze centres d’intérêt maximum.');
      }
      user.interests = interests;
    }
    if (dto.profileVisibility !== undefined)
      user.profileVisibility = dto.profileVisibility;
    if (dto.showNeighborhood !== undefined)
      user.showNeighborhood = dto.showNeighborhood;
    if (dto.showReviews !== undefined) user.showReviews = dto.showReviews;
    if (dto.showCompletedServices !== undefined)
      user.showCompletedServices = dto.showCompletedServices;
    if (dto.showReputation !== undefined)
      user.showReputation = dto.showReputation;
    user.profileUpdatedAt = new Date();
    await user.save();
    void this.graphSyncService?.enqueue(GraphEntityType.USER, user.id);
    return this.presentOwnProfile(user);
  }

  presignAvatar(dto: PresignAvatarUploadDto, actor: AuthenticatedUser) {
    return this.storageService.presignAvatarUpload(dto, actor);
  }

  async completeAvatar(fileId: string, actor: AuthenticatedUser) {
    const file = await this.storageService.findFile(fileId);
    if (
      file.ownerId !== actor.sub ||
      file.contextId !== actor.sub ||
      file.contextType !== StorageContextType.USER_AVATAR
    ) {
      throw new ForbiddenException('Cet avatar ne vous appartient pas.');
    }
    const completed = await this.storageService.completeUpload(fileId, actor);
    if (completed.status !== StorageFileStatus.VERIFIED) {
      throw new BadRequestException('L’avatar n’a pas été vérifié.');
    }
    const user = await this.findUser(actor.sub);
    const previousAvatarId = user.avatarFileId;
    user.avatarFileId = fileId;
    user.profileUpdatedAt = new Date();
    await user.save();
    void this.graphSyncService?.enqueue(GraphEntityType.USER, user.id);
    if (previousAvatarId && previousAvatarId !== fileId) {
      await this.storageService.removeOrphan(previousAvatarId);
    }
    return this.presentOwnProfile(user);
  }

  async removeAvatar(actor: AuthenticatedUser) {
    const user = await this.findUser(actor.sub);
    const previousAvatarId = user.avatarFileId;
    if (!previousAvatarId) return this.presentOwnProfile(user);
    user.avatarFileId = null;
    user.profileUpdatedAt = new Date();
    await user.save();
    void this.graphSyncService?.enqueue(GraphEntityType.USER, user.id);
    await this.storageService.removeOrphan(previousAvatarId);
    return this.presentOwnProfile(user);
  }

  async getPublicProfile(userId: string, actor: AuthenticatedUser) {
    const user = await this.findUser(userId);
    const isOwner = actor.sub === userId;
    const privileged = [Role.ADMIN, Role.MODERATOR].includes(actor.role);
    const expanded =
      isOwner ||
      privileged ||
      (user.profileVisibility === ProfileVisibility.NEIGHBORHOOD &&
        user.neighborhoodId === actor.neighborhoodId);
    const avatarUrl = await this.avatarUrl(user.avatarFileId);
    const minimal = {
      id: user.id,
      displayName: user.displayName,
      avatarUrl,
      isRestricted: !expanded,
      permissions: { canEdit: isOwner },
    };
    if (!expanded) return minimal;

    const [reputation, recentServices, reviews, neighborhood] =
      await Promise.all([
        this.reputationService.getOne(user.id),
        this.serviceModel
          .find({
            ownerId: user.id,
            status: { $in: [ServiceStatus.PUBLISHED, ServiceStatus.COMPLETED] },
          })
          .select('_id title category type status completedAt createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .exec(),
        user.showReviews
          ? this.reviewsService.listForUser(
              user.id,
              { page: 1, limit: 5, sort: 'newest' },
              actor,
            )
          : Promise.resolve({ items: [], page: 1, limit: 5, total: 0 }),
        user.showNeighborhood
          ? this.findNeighborhood(user.neighborhoodId)
          : null,
      ]);
    return {
      ...minimal,
      bio: user.bio,
      interests: user.interests,
      neighborhoodId: user.showNeighborhood ? user.neighborhoodId : null,
      neighborhood,
      profileVisibility: user.profileVisibility,
      reputation: user.showReputation ? reputation : null,
      completedServicesCount: user.showCompletedServices
        ? reputation.completedServicesCount
        : null,
      recentServices: user.showCompletedServices
        ? recentServices.map((service) => ({
            id: String(service._id),
            title: service.title,
            category: service.category,
            type: service.type,
            status: service.status,
          }))
        : [],
      reviews: user.showReviews ? reviews : null,
      visibility: {
        showNeighborhood: user.showNeighborhood,
        showReviews: user.showReviews,
        showCompletedServices: user.showCompletedServices,
        showReputation: user.showReputation,
      },
    };
  }

  private async presentOwnProfile(user: UserDocument) {
    const [reputation, avatarUrl, neighborhood] = await Promise.all([
      this.reputationService.getOne(user.id),
      this.avatarUrl(user.avatarFileId),
      this.findNeighborhood(user.neighborhoodId),
    ]);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      neighborhoodId: user.neighborhoodId,
      neighborhood,
      avatarUrl,
      bio: user.bio,
      interests: user.interests,
      profileVisibility: user.profileVisibility,
      showNeighborhood: user.showNeighborhood,
      showReviews: user.showReviews,
      showCompletedServices: user.showCompletedServices,
      showReputation: user.showReputation,
      profileUpdatedAt: user.profileUpdatedAt,
      reputation,
    };
  }

  private async avatarUrl(fileId: string | null) {
    if (!fileId) return null;
    const urls = await this.storageService.getAvatarUrlsByFileIds([fileId]);
    return urls.get(fileId) ?? null;
  }

  private async findNeighborhood(neighborhoodId: string) {
    const clauses: Array<Record<string, unknown>> = [{ slug: neighborhoodId }];
    if (Types.ObjectId.isValid(neighborhoodId))
      clauses.push({ _id: neighborhoodId });
    const neighborhood = await this.neighborhoodModel
      .findOne({ $or: clauses })
      .select('_id name city')
      .lean<{ _id: unknown; name: string; city: string }>()
      .exec();
    return neighborhood
      ? {
          id: String(neighborhood._id),
          name: neighborhood.name,
          city: neighborhood.city,
        }
      : null;
  }

  private async findUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Profil introuvable.');
    }
    const user = await this.userModel
      .findOne({ _id: userId, isActive: true })
      .exec();
    if (!user) throw new NotFoundException('Profil introuvable.');
    return user;
  }

  private cleanText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }
}
