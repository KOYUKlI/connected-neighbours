import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';

import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  EventDocument,
  NeighborhoodEvent,
} from '../events/schemas/event.schema';
import {
  Neighborhood,
  NeighborhoodDocument,
} from '../neighborhoods/schemas/neighborhood.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { normalizeGraphError } from './graph.errors';
import { GraphProjectionService } from './graph-projection.service';
import {
  GraphEntityType,
  GraphReconciliationReport,
  GraphSyncOperation,
} from './graph.types';

type IdRow = { _id: unknown };

const RECONCILIATION_ORDER = [
  GraphEntityType.NEIGHBORHOOD,
  GraphEntityType.USER,
  GraphEntityType.SERVICE,
  GraphEntityType.EVENT,
  GraphEntityType.REVIEW,
];

@Injectable()
export class GraphReconciliationService {
  private latestReport: GraphReconciliationReport | null = null;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly projectionService: GraphProjectionService,
  ) {}

  get latest() {
    return this.latestReport;
  }

  async reconcile(
    entityTypes: GraphEntityType[] = Object.values(GraphEntityType),
    dryRun = false,
  ) {
    const runId = randomUUID();
    const startedAt = new Date();
    const report: GraphReconciliationReport = {
      runId,
      dryRun,
      startedAt,
      completedAt: startedAt,
      projected: {},
      removed: {},
      errors: [],
    };
    const requestedTypes = new Set(entityTypes);
    for (const entityType of RECONCILIATION_ORDER.filter((type) =>
      requestedTypes.has(type),
    )) {
      if (dryRun) {
        report.projected[entityType] = await this.count(entityType);
        continue;
      }
      let cursor: string | null = null;
      let projected = 0;
      do {
        const rows = await this.nextIds(entityType, cursor, 100);
        for (const row of rows) {
          const entityId = String(row._id);
          try {
            await this.projectionService.project(
              entityType,
              entityId,
              GraphSyncOperation.UPSERT,
              runId,
            );
            projected += 1;
          } catch (error) {
            report.errors.push({
              entityType,
              entityId,
              code: normalizeGraphError(error),
            });
          }
        }
        cursor = rows.length === 100 ? String(rows[rows.length - 1]._id) : null;
      } while (cursor);
      report.projected[entityType] = projected;
      if (entityType !== GraphEntityType.REVIEW) {
        report.removed[entityType] = await this.projectionService.cleanupStale(
          entityType,
          runId,
        );
      }
    }
    report.completedAt = new Date();
    this.latestReport = report;
    return report;
  }

  private count(entityType: GraphEntityType) {
    switch (entityType) {
      case GraphEntityType.USER:
        return this.userModel.countDocuments().exec();
      case GraphEntityType.NEIGHBORHOOD:
        return this.neighborhoodModel.countDocuments().exec();
      case GraphEntityType.SERVICE:
        return this.serviceModel.countDocuments().exec();
      case GraphEntityType.EVENT:
        return this.eventModel.countDocuments().exec();
      case GraphEntityType.REVIEW:
        return this.reviewModel.countDocuments().exec();
    }
  }

  private nextIds(
    entityType: GraphEntityType,
    cursor: string | null,
    limit: number,
  ): Promise<IdRow[]> {
    const filter =
      cursor && Types.ObjectId.isValid(cursor) ? { _id: { $gt: cursor } } : {};
    switch (entityType) {
      case GraphEntityType.USER:
        return this.userModel
          .find(filter)
          .select('_id')
          .sort({ _id: 1 })
          .limit(limit)
          .lean<IdRow[]>()
          .exec();
      case GraphEntityType.NEIGHBORHOOD:
        return this.neighborhoodModel
          .find(filter)
          .select('_id')
          .sort({ _id: 1 })
          .limit(limit)
          .lean<IdRow[]>()
          .exec();
      case GraphEntityType.SERVICE:
        return this.serviceModel
          .find(filter)
          .select('_id')
          .sort({ _id: 1 })
          .limit(limit)
          .lean<IdRow[]>()
          .exec();
      case GraphEntityType.EVENT:
        return this.eventModel
          .find(filter)
          .select('_id')
          .sort({ _id: 1 })
          .limit(limit)
          .lean<IdRow[]>()
          .exec();
      case GraphEntityType.REVIEW:
        return this.reviewModel
          .find(filter)
          .select('_id')
          .sort({ _id: 1 })
          .limit(limit)
          .lean<IdRow[]>()
          .exec();
    }
  }
}
