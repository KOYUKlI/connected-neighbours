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
import { PointsModule } from '../points/points.module';
import {
  ServiceProof,
  ServiceProofSchema,
} from '../services/schemas/service-proof.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { DemoSeedService } from './demo-seed.service';

@Module({
  imports: [
    AuthModule,
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
    ]),
  ],
  providers: [DemoSeedService],
})
export class DemoSeedModule {}
