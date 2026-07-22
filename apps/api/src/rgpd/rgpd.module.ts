import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { Alert, AlertSchema } from '../alerts/schemas/alert.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import {
  EventResponse,
  EventResponseSchema,
} from '../events/schemas/event-response.schema';
import { EventSchema, NeighborhoodEvent } from '../events/schemas/event.schema';
import {
  ManagedDocument,
  ManagedDocumentSchema,
} from '../documents/schemas/managed-document.schema';
import {
  PointTransaction,
  PointTransactionSchema,
} from '../points/schemas/point-transaction.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import {
  VoteAnswer,
  VoteAnswerSchema,
} from '../votes/schemas/vote-answer.schema';
import { Vote, VoteSchema } from '../votes/schemas/vote.schema';
import {
  SyncOperation,
  SyncOperationSchema,
} from '../sync/schemas/sync-operation.schema';
import { RgpdController } from './rgpd.controller';
import { RgpdService } from './rgpd.service';
import { ReviewsModule } from '../reviews/reviews.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ReviewsModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: PointTransaction.name, schema: PointTransactionSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: SyncOperation.name, schema: SyncOperationSchema },
      { name: ManagedDocument.name, schema: ManagedDocumentSchema },
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: Vote.name, schema: VoteSchema },
      { name: VoteAnswer.name, schema: VoteAnswerSchema },
    ]),
  ],
  controllers: [RgpdController],
  providers: [RgpdService],
})
export class RgpdModule {}
