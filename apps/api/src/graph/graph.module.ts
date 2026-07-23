import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import {
  EventResponse,
  EventResponseSchema,
} from '../events/schemas/event-response.schema';
import { EventSchema, NeighborhoodEvent } from '../events/schemas/event.schema';
import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { AdminGraphController } from './admin-graph.controller';
import { GraphAdminService } from './graph-admin.service';
import { GraphHealthService } from './graph-health.service';
import { GraphProjectionService } from './graph-projection.service';
import { GraphRecommendationQueryService } from './graph-recommendation-query.service';
import { GraphReconciliationService } from './graph-reconciliation.service';
import { GraphSyncService } from './graph-sync.service';
import { GraphSyncWorker } from './graph-sync.worker';
import { Neo4jService } from './neo4j.service';
import {
  GraphSyncJob,
  GraphSyncJobSchema,
} from './schemas/graph-sync-job.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GraphSyncJob.name, schema: GraphSyncJobSchema },
      { name: User.name, schema: UserSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [AdminGraphController],
  providers: [
    Neo4jService,
    GraphHealthService,
    GraphSyncService,
    GraphProjectionService,
    GraphReconciliationService,
    GraphRecommendationQueryService,
    GraphSyncWorker,
    GraphAdminService,
  ],
  exports: [
    Neo4jService,
    GraphHealthService,
    GraphSyncService,
    GraphRecommendationQueryService,
  ],
})
export class GraphModule {}
