import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
  EventResponse,
  EventResponseDocument,
  EventResponseStatus,
} from '../events/schemas/event-response.schema';
import {
  EventDocument,
  NeighborhoodEvent,
} from '../events/schemas/event.schema';
import {
  Neighborhood,
  NeighborhoodDocument,
} from '../neighborhoods/schemas/neighborhood.schema';
import {
  Review,
  ReviewDocument,
  ReviewStatus,
} from '../reviews/schemas/review.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
  ServiceType,
} from '../services/schemas/service.schema';
import { GraphEntityType, GraphSyncOperation } from './graph.types';
import { Neo4jService } from './neo4j.service';

type UserProjectionRow = User & { _id: unknown; updatedAt?: Date };
type NeighborhoodProjectionRow = Neighborhood & {
  _id: unknown;
  updatedAt?: Date;
};
type ServiceProjectionRow = Service & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type EventProjectionRow = NeighborhoodEvent & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type ReviewProjectionRow = Review & { _id: unknown; createdAt?: Date };

@Injectable()
export class GraphProjectionService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventResponse.name)
    private readonly eventResponseModel: Model<EventResponseDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly neo4jService: Neo4jService,
  ) {}

  async project(
    entityType: GraphEntityType,
    entityId: string,
    operation: GraphSyncOperation,
    reconcileRunId?: string,
  ) {
    if (operation === GraphSyncOperation.DELETE) {
      await this.deleteProjection(entityType, entityId);
      return;
    }
    switch (entityType) {
      case GraphEntityType.USER:
        await this.projectUser(entityId, reconcileRunId);
        return;
      case GraphEntityType.NEIGHBORHOOD:
        await this.projectNeighborhood(entityId, reconcileRunId);
        return;
      case GraphEntityType.SERVICE:
        await this.projectService(entityId, reconcileRunId);
        return;
      case GraphEntityType.EVENT:
        await this.projectEvent(entityId, reconcileRunId);
        return;
      case GraphEntityType.REVIEW:
        await this.projectReview(entityId);
    }
  }

  async cleanupStale(entityType: GraphEntityType, reconcileRunId: string) {
    const labels: Partial<Record<GraphEntityType, string>> = {
      [GraphEntityType.USER]: 'User',
      [GraphEntityType.NEIGHBORHOOD]: 'Neighborhood',
      [GraphEntityType.SERVICE]: 'Service',
      [GraphEntityType.EVENT]: 'Event',
    };
    const label = labels[entityType];
    if (!label) return 0;
    const result = await this.neo4jService.executeWrite(
      `MATCH (node:${label}) WHERE node.reconcileRunId IS NULL OR node.reconcileRunId <> $runId DETACH DELETE node RETURN count(node) AS removed`,
      { runId: reconcileRunId },
    );
    return this.toNumber(result.records[0]?.get('removed'));
  }

  private async projectUser(entityId: string, reconcileRunId?: string) {
    const user = await this.userModel
      .findById(entityId)
      .select(
        '_id displayName neighborhoodId interests profileVisibility isActive updatedAt',
      )
      .lean<UserProjectionRow | null>()
      .exec();
    if (!user || !user.isActive) {
      await this.deleteProjection(GraphEntityType.USER, entityId);
      return;
    }
    const neighborhoodMongoId = await this.resolveNeighborhoodMongoId(
      user.neighborhoodId,
    );
    await this.neo4jService.executeWrite(
      `MERGE (user:User {mongoId: $mongoId})
       SET user.displayName = $displayName,
           user.profileVisibility = $profileVisibility,
           user.interests = $interests,
           user.accountStatus = 'active',
           user.updatedAt = $updatedAt,
           user.reconcileRunId = coalesce($reconcileRunId, user.reconcileRunId)
       WITH user
       OPTIONAL MATCH (user)-[old:LIVES_IN]->(:Neighborhood)
       DELETE old
       WITH user
       OPTIONAL MATCH (neighborhood:Neighborhood {mongoId: $neighborhoodMongoId})
       FOREACH (_ IN CASE WHEN neighborhood IS NULL THEN [] ELSE [1] END |
         MERGE (user)-[:LIVES_IN]->(neighborhood)
       )`,
      {
        mongoId: String(user._id),
        displayName: user.displayName,
        profileVisibility:
          user.profileVisibility ?? ProfileVisibility.NEIGHBORHOOD,
        interests: this.normalizeTags(user.interests),
        updatedAt: this.iso(user.updatedAt),
        neighborhoodMongoId,
        reconcileRunId: reconcileRunId ?? null,
      },
    );
  }

  private async projectNeighborhood(entityId: string, reconcileRunId?: string) {
    const neighborhood = await this.neighborhoodModel
      .findById(entityId)
      .select('_id name slug city status isActive updatedAt')
      .lean<NeighborhoodProjectionRow | null>()
      .exec();
    if (!neighborhood) {
      await this.deleteProjection(GraphEntityType.NEIGHBORHOOD, entityId);
      return;
    }
    await this.neo4jService.executeWrite(
      `MERGE (neighborhood:Neighborhood {mongoId: $mongoId})
       SET neighborhood.name = $name,
           neighborhood.slug = $slug,
           neighborhood.city = $city,
           neighborhood.status = $status,
           neighborhood.updatedAt = $updatedAt,
           neighborhood.reconcileRunId = coalesce($reconcileRunId, neighborhood.reconcileRunId)`,
      {
        mongoId: String(neighborhood._id),
        name: neighborhood.name,
        slug: neighborhood.slug,
        city: neighborhood.city ?? null,
        status:
          neighborhood.status ??
          (neighborhood.isActive === false ? 'archived' : 'active'),
        updatedAt: this.iso(neighborhood.updatedAt),
        reconcileRunId: reconcileRunId ?? null,
      },
    );
  }

  private async projectService(entityId: string, reconcileRunId?: string) {
    const service = await this.serviceModel
      .findById(entityId)
      .lean<ServiceProjectionRow | null>()
      .exec();
    if (!service) {
      await this.deleteProjection(GraphEntityType.SERVICE, entityId);
      return;
    }
    const [neighborhoodMongoId, contract] = await Promise.all([
      this.resolveNeighborhoodMongoId(service.neighborhoodId),
      this.contractModel
        .findOne({ serviceId: String(service._id) })
        .select('_id requesterId providerId status completedAt')
        .lean<{
          _id: unknown;
          requesterId: string;
          providerId: string;
          status: ContractStatus;
          completedAt: Date | null;
        } | null>()
        .exec(),
    ]);
    await this.neo4jService.executeWrite(
      `MERGE (service:Service {mongoId: $mongoId})
       SET service.title = $title,
           service.category = $category,
           service.status = $status,
           service.createdAt = $createdAt,
           service.completedAt = $completedAt,
           service.reconcileRunId = coalesce($reconcileRunId, service.reconcileRunId)
       WITH service
       OPTIONAL MATCH ()-[old]->(service)
       WHERE type(old) IN ['CREATED_SERVICE', 'REQUESTED_SERVICE', 'PROVIDED_SERVICE']
       DELETE old
       WITH service
       OPTIONAL MATCH (service)-[located:LOCATED_IN]->(:Neighborhood)
       DELETE located
       WITH service
       OPTIONAL MATCH (owner:User {mongoId: $ownerId})
       FOREACH (_ IN CASE WHEN owner IS NULL THEN [] ELSE [1] END |
         MERGE (owner)-[:CREATED_SERVICE]->(service)
       )
       FOREACH (_ IN CASE WHEN owner IS NULL OR $isRequest = false THEN [] ELSE [1] END |
         MERGE (owner)-[:REQUESTED_SERVICE]->(service)
       )
       WITH service
       OPTIONAL MATCH (provider:User {mongoId: $providerId})
       FOREACH (_ IN CASE WHEN provider IS NULL THEN [] ELSE [1] END |
         MERGE (provider)-[:PROVIDED_SERVICE]->(service)
       )
       WITH service
       OPTIONAL MATCH (neighborhood:Neighborhood {mongoId: $neighborhoodMongoId})
       FOREACH (_ IN CASE WHEN neighborhood IS NULL THEN [] ELSE [1] END |
         MERGE (service)-[:LOCATED_IN]->(neighborhood)
       )`,
      {
        mongoId: String(service._id),
        title: service.title,
        category: service.category.trim().toLowerCase(),
        status: service.status,
        createdAt: this.iso(service.createdAt),
        completedAt: this.iso(service.completedAt),
        ownerId: service.ownerId,
        providerId: contract?.providerId ?? null,
        neighborhoodMongoId,
        isRequest: service.type === ServiceType.REQUEST,
        reconcileRunId: reconcileRunId ?? null,
      },
    );
    await this.neo4jService.executeWrite(
      `MATCH ()-[helped:HELPED]->() WHERE helped.serviceId = $serviceId DELETE helped`,
      { serviceId: String(service._id) },
    );
    if (
      service.status === ServiceStatus.COMPLETED &&
      contract?.status === ContractStatus.COMPLETED
    ) {
      await this.neo4jService.executeWrite(
        `MATCH (provider:User {mongoId: $providerId}), (requester:User {mongoId: $requesterId})
         MERGE (provider)-[helped:HELPED {contractId: $contractId}]->(requester)
         SET helped.serviceId = $serviceId,
             helped.completedAt = $completedAt,
             helped.category = $category`,
        {
          providerId: contract.providerId,
          requesterId: contract.requesterId,
          contractId: String(contract._id),
          serviceId: String(service._id),
          completedAt: this.iso(contract.completedAt ?? service.completedAt),
          category: service.category.trim().toLowerCase(),
        },
      );
    }
  }

  private async projectEvent(entityId: string, reconcileRunId?: string) {
    const event = await this.eventModel
      .findById(entityId)
      .lean<EventProjectionRow | null>()
      .exec();
    if (!event) {
      await this.deleteProjection(GraphEntityType.EVENT, entityId);
      return;
    }
    const [neighborhoodMongoId, responses] = await Promise.all([
      this.resolveNeighborhoodMongoId(event.neighborhoodId),
      this.eventResponseModel
        .find({ eventId: String(event._id) })
        .select('userId response interest')
        .lean<
          Array<{
            userId: string;
            response?: EventResponseStatus;
            interest?: EventResponseStatus;
          }>
        >()
        .exec(),
    ]);
    await this.neo4jService.executeWrite(
      `MERGE (event:Event {mongoId: $mongoId})
       SET event.title = $title,
           event.category = $category,
           event.status = $status,
           event.startsAt = $startsAt,
           event.createdAt = $createdAt,
           event.reconcileRunId = coalesce($reconcileRunId, event.reconcileRunId)
       WITH event
       OPTIONAL MATCH ()-[old]->(event)
       WHERE type(old) IN ['CREATED_EVENT', 'PARTICIPATED_IN', 'INTERESTED_IN']
       DELETE old
       WITH event
       OPTIONAL MATCH (event)-[located:LOCATED_IN]->(:Neighborhood)
       DELETE located
       WITH event
       OPTIONAL MATCH (organizer:User {mongoId: $organizerId})
       FOREACH (_ IN CASE WHEN organizer IS NULL THEN [] ELSE [1] END |
         MERGE (organizer)-[:CREATED_EVENT]->(event)
       )
       WITH event
       OPTIONAL MATCH (neighborhood:Neighborhood {mongoId: $neighborhoodMongoId})
       FOREACH (_ IN CASE WHEN neighborhood IS NULL THEN [] ELSE [1] END |
         MERGE (event)-[:LOCATED_IN]->(neighborhood)
       )`,
      {
        mongoId: String(event._id),
        title: event.title,
        category: event.category,
        status: event.status,
        startsAt: this.iso(event.startsAt),
        createdAt: this.iso(event.createdAt),
        organizerId: event.organizerId,
        neighborhoodMongoId,
        reconcileRunId: reconcileRunId ?? null,
      },
    );
    const going = responses
      .filter(
        (entry) =>
          (entry.response ?? entry.interest) === EventResponseStatus.GOING,
      )
      .map((entry) => entry.userId);
    const interested = responses
      .filter((entry) =>
        [
          EventResponseStatus.INTERESTED,
          EventResponseStatus.MAYBE,
          EventResponseStatus.WAITLISTED,
        ].includes(
          entry.response ?? entry.interest ?? EventResponseStatus.CANCELLED,
        ),
      )
      .map((entry) => entry.userId);
    await this.neo4jService.executeWrite(
      `MATCH (event:Event {mongoId: $eventId})
       UNWIND $userIds AS userId
       MATCH (user:User {mongoId: userId})
       MERGE (user)-[:PARTICIPATED_IN]->(event)`,
      { eventId: String(event._id), userIds: going },
    );
    await this.neo4jService.executeWrite(
      `MATCH (event:Event {mongoId: $eventId})
       UNWIND $userIds AS userId
       MATCH (user:User {mongoId: userId})
       MERGE (user)-[:INTERESTED_IN]->(event)`,
      { eventId: String(event._id), userIds: interested },
    );
  }

  private async projectReview(entityId: string) {
    const review = await this.reviewModel
      .findById(entityId)
      .lean<ReviewProjectionRow | null>()
      .exec();
    await this.neo4jService.executeWrite(
      `MATCH ()-[reviewed:REVIEWED]->() WHERE reviewed.reviewId = $reviewId DELETE reviewed`,
      { reviewId: entityId },
    );
    if (!review || review.status !== ReviewStatus.PUBLISHED) return;
    await this.neo4jService.executeWrite(
      `MATCH (author:User {mongoId: $authorId}), (target:User {mongoId: $targetUserId})
       MERGE (author)-[reviewed:REVIEWED {reviewId: $reviewId}]->(target)
       SET reviewed.rating = $rating, reviewed.createdAt = $createdAt`,
      {
        authorId: review.authorId,
        targetUserId: review.targetUserId,
        reviewId: String(review._id),
        rating: review.rating,
        createdAt: this.iso(review.createdAt),
      },
    );
  }

  private async deleteProjection(
    entityType: GraphEntityType,
    entityId: string,
  ) {
    const labels: Partial<Record<GraphEntityType, string>> = {
      [GraphEntityType.USER]: 'User',
      [GraphEntityType.NEIGHBORHOOD]: 'Neighborhood',
      [GraphEntityType.SERVICE]: 'Service',
      [GraphEntityType.EVENT]: 'Event',
    };
    if (entityType === GraphEntityType.REVIEW) {
      await this.neo4jService.executeWrite(
        `MATCH ()-[reviewed:REVIEWED]->() WHERE reviewed.reviewId = $mongoId DELETE reviewed`,
        { mongoId: entityId },
      );
      return;
    }
    const label = labels[entityType];
    if (!label) return;
    await this.neo4jService.executeWrite(
      `MATCH (node:${label} {mongoId: $mongoId}) DETACH DELETE node`,
      { mongoId: entityId },
    );
  }

  private async resolveNeighborhoodMongoId(identifier: string) {
    if (!identifier) return null;
    const filters: Array<Record<string, unknown>> = [{ slug: identifier }];
    if (Types.ObjectId.isValid(identifier)) filters.push({ _id: identifier });
    const row = await this.neighborhoodModel
      .findOne({ $or: filters })
      .select('_id')
      .lean<{ _id: unknown } | null>()
      .exec();
    return row ? String(row._id) : null;
  }

  private normalizeTags(values: string[] | undefined) {
    return [
      ...new Set((values ?? []).map((value) => value.trim().toLowerCase())),
    ]
      .filter(Boolean)
      .slice(0, 12);
  }

  private iso(value: Date | string | null | undefined) {
    if (!value) return null;
    return value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  }

  private toNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value ?? 0);
  }
}
