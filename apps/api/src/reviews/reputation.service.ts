import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';

export type ReputationSummary = {
  averageRating: number | null;
  reviewCount: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  completedServicesCount: number;
  reputationScore: number | null;
  calculatedAt: string;
};

type ReviewAggregate = {
  _id: string;
  reviewCount: number;
  sumRatings: number;
  rating1: number;
  rating2: number;
  rating3: number;
  rating4: number;
  rating5: number;
};

type CompletedAggregate = { _id: string; count: number };

@Injectable()
export class ReputationService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
  ) {}

  async getOne(userId: string) {
    const summaries = await this.getSummariesByUserIds([userId]);
    return summaries.get(userId) ?? this.emptySummary();
  }

  async getSummariesByUserIds(userIds: string[]) {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return new Map<string, ReputationSummary>();

    const [reviewRows, completedRows] = await Promise.all([
      this.reviewModel
        .aggregate<ReviewAggregate>([
          {
            $match: {
              targetUserId: { $in: ids },
              status: ReviewStatus.PUBLISHED,
            },
          },
          {
            $group: {
              _id: '$targetUserId',
              reviewCount: { $sum: 1 },
              sumRatings: { $sum: '$rating' },
              rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
              rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
              rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
              rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
              rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            },
          },
        ])
        .exec(),
      this.contractModel
        .aggregate<CompletedAggregate>([
          {
            $match: {
              status: ContractStatus.COMPLETED,
              $or: [
                { requesterId: { $in: ids } },
                { providerId: { $in: ids } },
              ],
            },
          },
          {
            $project: {
              participants: { $setUnion: [['$requesterId'], ['$providerId']] },
            },
          },
          { $unwind: '$participants' },
          { $match: { participants: { $in: ids } } },
          {
            $group: { _id: '$participants', contracts: { $addToSet: '$_id' } },
          },
          { $project: { count: { $size: '$contracts' } } },
        ])
        .exec(),
    ]);

    const reviews = new Map(reviewRows.map((row) => [row._id, row]));
    const completed = new Map(completedRows.map((row) => [row._id, row.count]));
    const calculatedAt = new Date().toISOString();

    return new Map(
      ids.map((id) => {
        const row = reviews.get(id);
        const reviewCount = row?.reviewCount ?? 0;
        const sumRatings = row?.sumRatings ?? 0;
        const averageRating =
          reviewCount === 0
            ? null
            : Math.round((sumRatings / reviewCount) * 100) / 100;
        const weightedRating =
          reviewCount === 0 ? null : (sumRatings + 4 * 5) / (reviewCount + 5);
        return [
          id,
          {
            averageRating,
            reviewCount,
            ratingDistribution: {
              '1': row?.rating1 ?? 0,
              '2': row?.rating2 ?? 0,
              '3': row?.rating3 ?? 0,
              '4': row?.rating4 ?? 0,
              '5': row?.rating5 ?? 0,
            },
            completedServicesCount: completed.get(id) ?? 0,
            reputationScore:
              weightedRating === null
                ? null
                : Math.round((weightedRating / 5) * 100),
            calculatedAt,
          } satisfies ReputationSummary,
        ];
      }),
    );
  }

  private emptySummary(): ReputationSummary {
    return {
      averageRating: null,
      reviewCount: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      completedServicesCount: 0,
      reputationScore: null,
      calculatedAt: new Date().toISOString(),
    };
  }
}
