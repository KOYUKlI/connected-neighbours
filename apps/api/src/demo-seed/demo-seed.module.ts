import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import {
  DisputeEvidence,
  DisputeEvidenceSchema,
} from '../disputes/schemas/dispute-evidence.schema';
import { Dispute, DisputeSchema } from '../disputes/schemas/dispute.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import {
  EventResponse,
  EventResponseSchema,
} from '../events/schemas/event-response.schema';
import { EventSchema, NeighborhoodEvent } from '../events/schemas/event.schema';
import { DocumentsModule } from '../documents/documents.module';
import { PointsModule } from '../points/points.module';
import {
  ServiceProof,
  ServiceProofSchema,
} from '../services/schemas/service-proof.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import {
  VoteAnswer,
  VoteAnswerSchema,
} from '../votes/schemas/vote-answer.schema';
import { Vote, VoteSchema } from '../votes/schemas/vote.schema';
import { DemoSeedService } from './demo-seed.service';

@Module({
  imports: [
    AuthModule,
    DocumentsModule,
    PointsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: ServiceProof.name, schema: ServiceProofSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Dispute.name, schema: DisputeSchema },
      { name: DisputeEvidence.name, schema: DisputeEvidenceSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: Vote.name, schema: VoteSchema },
      { name: VoteAnswer.name, schema: VoteAnswerSchema },
    ]),
  ],
  providers: [DemoSeedService],
})
export class DemoSeedModule {}
