import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert, AlertSchema } from './schemas/alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
