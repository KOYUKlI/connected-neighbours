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
  SyncOperation,
  SyncOperationSchema,
} from '../sync/schemas/sync-operation.schema';
import { RgpdController } from './rgpd.controller';
import { RgpdService } from './rgpd.service';

@Module({
  imports: [
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
    ]),
  ],
  controllers: [RgpdController],
  providers: [RgpdService],
})
export class RgpdModule {}
