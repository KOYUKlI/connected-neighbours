import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Alert, AlertSchema } from '../alerts/schemas/alert.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import {
  SyncOperation,
  SyncOperationSchema,
} from './schemas/sync-operation.schema';
import { SyncState, SyncStateSchema } from './schemas/sync-state.schema';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SyncOperation.name, schema: SyncOperationSchema },
      { name: SyncState.name, schema: SyncStateSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Alert.name, schema: AlertSchema },
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
