import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ProfileVisibility,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import { ReputationService } from '../reviews/reputation.service';
import { StorageService } from '../storage/storage.service';
import { PublicUserDto } from './dto/public-user.dto';

type PublicUserRow = {
  _id: unknown;
  displayName: string;
  neighborhoodId: string;
  avatarFileId: string | null;
  profileVisibility: ProfileVisibility;
  showReputation: boolean;
  showCompletedServices: boolean;
};

@Injectable()
export class PublicUsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly reputationService: ReputationService,
    private readonly storageService: StorageService,
  ) {}

  async findOne(userId: string): Promise<PublicUserDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Profil public introuvable.');
    }

    const profiles = await this.findByIds([userId]);
    const profile = profiles.get(userId);

    if (!profile) {
      throw new NotFoundException('Profil public introuvable.');
    }

    return profile;
  }

  async findByIds(userIds: string[]): Promise<Map<string, PublicUserDto>> {
    const uniqueIds = [
      ...new Set(userIds.filter((id) => Types.ObjectId.isValid(id))),
    ];

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const users = await this.userModel
      .find({ _id: { $in: uniqueIds }, isActive: true })
      .select(
        '_id displayName neighborhoodId avatarFileId profileVisibility showReputation showCompletedServices',
      )
      .lean<PublicUserRow[]>()
      .exec();
    const [reputations, avatarUrls] = await Promise.all([
      this.reputationService.getSummariesByUserIds(
        users.map((user) => String(user._id)),
      ),
      this.storageService.getAvatarUrlsByFileIds(
        users
          .map((user) => user.avatarFileId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]);

    return new Map(
      users.map((user) => {
        const id = String(user._id);
        const reputation = reputations.get(id);
        const isExpanded = user.profileVisibility !== ProfileVisibility.PRIVATE;
        return [
          id,
          {
            id,
            displayName: user.displayName,
            avatarUrl: user.avatarFileId
              ? (avatarUrls.get(user.avatarFileId) ?? null)
              : null,
            neighborhoodId: user.neighborhoodId,
            reputationScore:
              isExpanded && user.showReputation
                ? (reputation?.reputationScore ?? null)
                : null,
            averageRating:
              isExpanded && user.showReputation
                ? (reputation?.averageRating ?? null)
                : null,
            reviewCount:
              isExpanded && user.showReputation
                ? (reputation?.reviewCount ?? 0)
                : 0,
            completedServicesCount:
              isExpanded && user.showCompletedServices
                ? (reputation?.completedServicesCount ?? 0)
                : 0,
          },
        ];
      }),
    );
  }
}
