import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import {
  ProfileVisibility,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import { EventsService } from '../events/events.service';
import { GraphRecommendationQueryService } from '../graph/graph-recommendation-query.service';
import { GraphRecommendationCandidate } from '../graph/graph.types';
import { Neo4jService } from '../graph/neo4j.service';
import {
  Neighborhood,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from '../neighborhoods/schemas/neighborhood.schema';
import { ServicesService } from '../services/services.service';
import { PublicUsersService } from '../users/public-users.service';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';

type RecommendationSource = 'graph' | 'fallback';
type UserRecommendationRow = Pick<
  User,
  'interests' | 'neighborhoodId' | 'profileVisibility' | 'isActive'
> & { _id: unknown; displayName: string };
type NeighborhoodRow = Pick<Neighborhood, 'slug' | 'status' | 'isActive'> & {
  _id: unknown;
};
type RankedItem<T extends { id: string }> = T & {
  recommendationReason: string;
  recommendationReasons: string[];
};

const REASON_LABELS: Record<string, string> = {
  same_neighborhood: 'Dans votre quartier',
  common_interest: 'Correspond à vos centres d’intérêt',
  previous_help: 'Une relation de confiance existe déjà',
  known_participants: 'Des voisins connus y participent',
  common_event: 'Vous avez participé à des événements communs',
};

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    private readonly servicesService: ServicesService,
    private readonly eventsService: EventsService,
    private readonly publicUsersService: PublicUsersService,
    private readonly graphQueries: GraphRecommendationQueryService,
    private readonly neo4jService: Neo4jService,
  ) {}

  async services(actor: AuthenticatedUser, query: RecommendationsQueryDto) {
    const context = await this.loadContext(actor);
    const excluded = new Set(query.excludeIds);
    const mongoItems = (
      await this.servicesService.findAll(
        { category: query.category, page: 1, limit: 100 },
        actor,
      )
    )
      .filter(
        (item) =>
          item.ownerId !== actor.sub &&
          !item.viewer.hasApplied &&
          !excluded.has(item.id),
      )
      .sort((left, right) =>
        this.compareFallback(
          this.serviceFallbackScore(left, context.interests),
          this.serviceFallbackScore(right, context.interests),
          left.createdAt,
          right.createdAt,
          left.id,
          right.id,
        ),
      );
    const graph = await this.tryGraph(() =>
      this.graphQueries.services({
        ...context,
        category: query.category,
        excludeIds: [...excluded],
        limit: Math.max(query.limit * 3, query.limit),
      }),
    );
    return this.rank(mongoItems, graph, query.limit, (item) =>
      this.serviceFallbackReasons(item, context.interests),
    );
  }

  async events(actor: AuthenticatedUser, query: RecommendationsQueryDto) {
    const context = await this.loadContext(actor);
    const excluded = new Set(query.excludeIds);
    const discovery = await this.eventsService.discover(actor, query.category);
    const mongoItems = (
      discovery.items.filter(
        (item): item is typeof item & { id: string } =>
          Boolean(item.id) && !excluded.has(item.id!),
      ) as Array<
        (typeof discovery.items)[number] & { id: string; category: string }
      >
    ).sort((left, right) => {
      const scoreDifference =
        this.eventFallbackScore(right, context.interests) -
        this.eventFallbackScore(left, context.interests);
      if (scoreDifference !== 0) return scoreDifference;
      const dateDifference =
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
      return dateDifference || left.id.localeCompare(right.id);
    });
    const graph = await this.tryGraph(() =>
      this.graphQueries.events({
        ...context,
        category: query.category,
        excludeIds: [...excluded],
        limit: Math.max(query.limit * 3, query.limit),
      }),
    );
    return this.rank(mongoItems, graph, query.limit, (item) =>
      this.eventFallbackReasons(item, context.interests),
    );
  }

  async neighbors(actor: AuthenticatedUser, query: RecommendationsQueryDto) {
    const context = await this.loadContext(actor);
    if (!context.neighborhoodMongoId) {
      return { source: 'fallback' as const, items: [] };
    }
    const excluded = new Set([...query.excludeIds, actor.sub]);
    const rows = await this.userModel
      .find({
        _id: { $ne: actor.sub },
        isActive: true,
        neighborhoodId: {
          $in: [context.neighborhoodMongoId, context.neighborhoodSlug],
        },
        profileVisibility: ProfileVisibility.NEIGHBORHOOD,
      })
      .select('_id displayName interests')
      .sort({ displayName: 1, _id: 1 })
      .limit(100)
      .lean<
        Array<{ _id: unknown; displayName: string; interests?: string[] }>
      >()
      .exec();
    const ids = rows
      .map((row) => String(row._id))
      .filter((id) => !excluded.has(id));
    const profiles = await this.publicUsersService.findByIds(ids);
    const interestsById = new Map(
      rows.map((row) => [
        String(row._id),
        (row.interests ?? []).map((item) => item.trim().toLowerCase()),
      ]),
    );
    const mongoItems = ids
      .map((id) => profiles.get(id))
      .filter((profile): profile is NonNullable<typeof profile> =>
        Boolean(profile),
      )
      .sort((left, right) => {
        const scoreDifference =
          this.neighborFallbackScore(
            right,
            context.interests,
            interestsById.get(right.id) ?? [],
          ) -
          this.neighborFallbackScore(
            left,
            context.interests,
            interestsById.get(left.id) ?? [],
          );
        return (
          scoreDifference || left.displayName.localeCompare(right.displayName)
        );
      });
    const graph = await this.tryGraph(() =>
      this.graphQueries.neighbors({
        ...context,
        category: undefined,
        excludeIds: [...excluded],
        limit: Math.max(query.limit * 3, query.limit),
      }),
    );
    return this.rank(mongoItems, graph, query.limit, (item) =>
      this.neighborFallbackReasons(
        item,
        context.interests,
        interestsById.get(item.id) ?? [],
      ),
    );
  }

  private async loadContext(actor: AuthenticatedUser) {
    const user = await this.userModel
      .findOne({ _id: actor.sub, isActive: true })
      .select(
        '_id interests neighborhoodId profileVisibility isActive displayName',
      )
      .lean<UserRecommendationRow | null>()
      .exec();
    const identifier = user?.neighborhoodId || actor.neighborhoodId;
    const neighborhood = identifier
      ? await this.neighborhoodModel
          .findOne({
            $and: [
              {
                $or: [
                  ...(Types.ObjectId.isValid(identifier)
                    ? [{ _id: identifier }]
                    : []),
                  { slug: identifier },
                ],
              },
              {
                $or: [
                  { status: NeighborhoodStatus.ACTIVE },
                  { status: { $exists: false }, isActive: { $ne: false } },
                ],
              },
            ],
          })
          .select('_id slug status isActive')
          .lean<NeighborhoodRow | null>()
          .exec()
      : null;
    return {
      userId: actor.sub,
      neighborhoodMongoId: neighborhood ? String(neighborhood._id) : null,
      neighborhoodSlug: neighborhood?.slug ?? null,
      interests: (user?.interests ?? []).map((item) =>
        item.trim().toLowerCase(),
      ),
    };
  }

  private async tryGraph(
    query: () => Promise<GraphRecommendationCandidate[]>,
  ): Promise<GraphRecommendationCandidate[] | null> {
    if (!this.neo4jService.canAttempt) return null;
    try {
      return await query();
    } catch {
      return null;
    }
  }

  private rank<T extends { id: string }>(
    mongoItems: T[],
    graphCandidates: GraphRecommendationCandidate[] | null,
    limit: number,
    fallbackReasons: (item: T) => string[],
  ): { source: RecommendationSource; items: Array<RankedItem<T>> } {
    const itemById = new Map(mongoItems.map((item) => [item.id, item]));
    const ranked: Array<RankedItem<T>> = [];
    const used = new Set<string>();
    for (const candidate of graphCandidates ?? []) {
      const item = itemById.get(candidate.id);
      if (!item || used.has(item.id)) continue;
      used.add(item.id);
      const reasons = candidate.reasons
        .map((reason) => REASON_LABELS[reason])
        .filter(Boolean);
      const itemFallbackReasons = fallbackReasons(item);
      ranked.push({
        ...item,
        recommendationReason: reasons[0] ?? itemFallbackReasons[0],
        recommendationReasons:
          reasons.length > 0 ? reasons : itemFallbackReasons,
      });
    }
    for (const item of mongoItems) {
      if (used.has(item.id)) continue;
      const reasons = fallbackReasons(item);
      ranked.push({
        ...item,
        recommendationReason: reasons[0],
        recommendationReasons: reasons,
      });
    }
    const graphWasUsed =
      graphCandidates !== null &&
      (ranked.length === 0 ||
        graphCandidates.some((item) => used.has(item.id)));
    return {
      source: graphWasUsed ? 'graph' : 'fallback',
      items: ranked.slice(0, limit),
    };
  }

  private serviceFallbackScore(
    item: {
      category: string;
      owner?: { reputationScore?: number | null } | null;
    },
    interests: string[],
  ) {
    const category = item.category?.trim().toLowerCase() ?? '';
    return (
      (interests.includes(category) ? 25 : 0) +
      Math.min(10, Math.max(0, item.owner?.reputationScore ?? 0) * 2)
    );
  }

  private serviceFallbackReasons(
    item: {
      category: string;
      owner?: { reputationScore?: number | null } | null;
    },
    interests: string[],
  ) {
    const category = item.category?.trim().toLowerCase() ?? '';
    const reasons = ['Dans votre quartier'];
    if (interests.includes(category)) {
      reasons.unshift('Correspond à vos centres d’intérêt');
    }
    if ((item.owner?.reputationScore ?? 0) >= 4) {
      reasons.push('Bien évalué par le voisinage');
    }
    return reasons;
  }

  private eventFallbackScore(
    item: { category: string; counts?: { participants?: number } },
    interests: string[],
  ) {
    const category = item.category?.trim().toLowerCase() ?? '';
    return (
      (interests.includes(category) ? 25 : 0) +
      Math.min(10, item.counts?.participants ?? 0)
    );
  }

  private eventFallbackReasons(
    item: { category: string },
    interests: string[],
  ) {
    const category = item.category?.trim().toLowerCase() ?? '';
    return interests.includes(category)
      ? ['Correspond à vos centres d’intérêt', 'Bientôt dans votre quartier']
      : ['Bientôt dans votre quartier'];
  }

  private neighborFallbackScore(
    item: { reputationScore: number | null },
    actorInterests: string[],
    candidateInterests: string[],
  ) {
    const commonInterests = candidateInterests.filter((interest) =>
      actorInterests.includes(interest),
    ).length;
    return commonInterests * 25 + Math.max(0, item.reputationScore ?? 0) * 2;
  }

  private neighborFallbackReasons(
    item: { reputationScore: number | null },
    actorInterests: string[],
    candidateInterests: string[],
  ) {
    const reasons = ['Actif dans votre quartier'];
    if (
      candidateInterests.some((interest) => actorInterests.includes(interest))
    ) {
      reasons.unshift('Vous partagez des centres d’intérêt');
    }
    if ((item.reputationScore ?? 0) >= 4) {
      reasons.push('Bien évalué par le voisinage');
    }
    return reasons;
  }

  private compareFallback(
    leftScore: number,
    rightScore: number,
    leftDate: Date | string | undefined,
    rightDate: Date | string | undefined,
    leftId: string,
    rightId: string,
  ) {
    const scoreDifference = rightScore - leftScore;
    if (scoreDifference !== 0) return scoreDifference;
    const dateDifference =
      new Date(rightDate ?? 0).getTime() - new Date(leftDate ?? 0).getTime();
    return dateDifference || leftId.localeCompare(rightId);
  }
}
