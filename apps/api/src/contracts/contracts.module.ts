import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { DocumentsModule } from '../documents/documents.module';
import { PointsModule } from '../points/points.module';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';

@Module({
  imports: [
    PointsModule,
    DocumentsModule,
    ServicesModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
    ]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
