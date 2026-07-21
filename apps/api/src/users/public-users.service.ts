import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { PublicUserDto } from './dto/public-user.dto';

type PublicUserRow = {
  _id: unknown;
  displayName: string;
  neighborhoodId: string;
};

type CompletedServicesCount = {
  _id: string;
  count: number;
};

@Injectable()
export class PublicUsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
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

    const [users, completedServiceCounts] = await Promise.all([
      this.userModel
        .find({ _id: { $in: uniqueIds }, isActive: true })
        .select('_id displayName neighborhoodId')
        .lean<PublicUserRow[]>()
        .exec(),
      this.serviceModel
        .aggregate<CompletedServicesCount>([
          {
            $match: {
              ownerId: { $in: uniqueIds },
              status: ServiceStatus.COMPLETED,
            },
          },
          { $group: { _id: '$ownerId', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const countsByUserId = new Map(
      completedServiceCounts.map((entry) => [entry._id, entry.count]),
    );

    return new Map(
      users.map((user) => {
        const id = String(user._id);
        return [
          id,
          {
            id,
            displayName: user.displayName,
            avatarUrl: null,
            neighborhoodId: user.neighborhoodId,
            reputationScore: null,
            completedServicesCount: countsByUserId.get(id) ?? 0,
          },
        ];
      }),
    );
  }
}
