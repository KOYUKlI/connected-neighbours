import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PointsModule } from '../points/points.module';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';

@Module({
  imports: [
    PointsModule,
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
