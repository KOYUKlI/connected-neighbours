import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Dispute, DisputeSchema } from '../disputes/schemas/dispute.schema';
import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { PointsModule } from '../points/points.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersModule } from '../users/users.module';
import {
  ServiceProof,
  ServiceProofSchema,
} from './schemas/service-proof.schema';
import { Service, ServiceSchema } from './schemas/service.schema';
import { ServiceExecutionService } from './service-execution.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    PointsModule,
    ReviewsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Dispute.name, schema: DisputeSchema },
      { name: ServiceProof.name, schema: ServiceProofSchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServiceExecutionService],
  exports: [ServicesService, ServiceExecutionService],
})
export class ServicesModule {}
