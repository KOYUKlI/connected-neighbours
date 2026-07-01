import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Alert, AlertSchema } from '../alerts/schemas/alert.schema';
import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { SyncState, SyncStateSchema } from '../sync/schemas/sync-state.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: SyncState.name, schema: SyncStateSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
