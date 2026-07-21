import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { PointsModule } from '../points/points.module';
import {
  ServiceProof,
  ServiceProofSchema,
} from '../services/schemas/service-proof.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { UsersModule } from '../users/users.module';
import { AdminDisputesController } from './admin-disputes.controller';
import {
  DisputeEvidence,
  DisputeEvidenceSchema,
} from './schemas/dispute-evidence.schema';
import { Dispute, DisputeSchema } from './schemas/dispute.schema';
import {
  DisputesController,
  ServiceDisputesController,
} from './disputes.controller';
import { DisputesService } from './disputes.service';

@Module({
  imports: [
    PointsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: Dispute.name, schema: DisputeSchema },
      { name: DisputeEvidence.name, schema: DisputeEvidenceSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: ServiceProof.name, schema: ServiceProofSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    ServiceDisputesController,
    DisputesController,
    AdminDisputesController,
  ],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
