import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Alert, AlertDocument } from '../alerts/schemas/alert.schema';
import {
  NeighborhoodEvent,
  EventDocument,
} from '../events/schemas/event.schema';
import { Incident, IncidentDocument } from '../incidents/schemas/incident.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Vote, VoteDocument } from '../votes/schemas/vote.schema';
import {
  DslCollection,
  DslCondition,
  ParsedDslQuery,
} from './dsl-parser.service';

type MongoFilter = Record<string, unknown>;

type ReadOnlyQueryModel = {
  find(filter: MongoFilter): {
    limit(limit: number): {
      lean(): {
        exec(): Promise<unknown[]>;
      };
    };
  };
};

@Injectable()
export class DslExecutorService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
  ) {}

  async execute(parsedQuery: ParsedDslQuery) {
    const filter = this.buildFilter(parsedQuery.conditions);
    const model = this.getModel(parsedQuery.collection);
    const results = await model
      .find(filter)
      .limit(parsedQuery.limit)
      .lean()
      .exec();

    return {
      collection: parsedQuery.collection,
      filter,
      limit: parsedQuery.limit,
      count: results.length,
      results,
    };
  }

  buildFilter(conditions: DslCondition[]): MongoFilter {
    const filter: MongoFilter = {};

    for (const condition of conditions) {
      if (condition.operator === '=') {
        filter[condition.field] = condition.value;
        continue;
      }

      if (condition.operator === 'CONTAINS') {
        filter[condition.field] = {
          $regex: this.escapeRegex(String(condition.value)),
          $options: 'i',
        };
        continue;
      }

      this.mergeFieldOperator(
        filter,
        condition.field,
        this.toMongoOperator(condition.operator),
        condition.value,
      );
    }

    return filter;
  }

  private mergeFieldOperator(
    filter: MongoFilter,
    field: string,
    operator: string,
    value: string | number,
  ) {
    const currentValue = filter[field];
    const currentFilter =
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
        ? (currentValue as Record<string, unknown>)
        : {};

    filter[field] = {
      ...currentFilter,
      [operator]: value,
    };
  }

  private toMongoOperator(operator: DslCondition['operator']) {
    switch (operator) {
      case '!=':
        return '$ne';
      case '>':
        return '$gt';
      case '<':
        return '$lt';
      case '>=':
        return '$gte';
      case '<=':
        return '$lte';
      default:
        return '$eq';
    }
  }

  private getModel(collection: DslCollection): ReadOnlyQueryModel {
    const models: Record<DslCollection, ReadOnlyQueryModel> = {
      services: this.serviceModel as unknown as ReadOnlyQueryModel,
      events: this.eventModel as unknown as ReadOnlyQueryModel,
      votes: this.voteModel as unknown as ReadOnlyQueryModel,
      incidents: this.incidentModel as unknown as ReadOnlyQueryModel,
      alerts: this.alertModel as unknown as ReadOnlyQueryModel,
    };

    return models[collection];
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
