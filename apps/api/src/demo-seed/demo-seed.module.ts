import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { PointsModule } from '../points/points.module';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { DemoSeedService } from './demo-seed.service';

@Module({
  imports: [
    AuthModule,
    PointsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
  ],
  providers: [DemoSeedService],
})
export class DemoSeedModule {}
