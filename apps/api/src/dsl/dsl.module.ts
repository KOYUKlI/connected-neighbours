import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Alert, AlertSchema } from '../alerts/schemas/alert.schema';
import { EventSchema, NeighborhoodEvent } from '../events/schemas/event.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Vote, VoteSchema } from '../votes/schemas/vote.schema';
import { DslController } from './dsl.controller';
import { DslExecutorService } from './dsl-executor.service';
import { DslParserService } from './dsl-parser.service';
import { DslService } from './dsl.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: Vote.name, schema: VoteSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Alert.name, schema: AlertSchema },
    ]),
  ],
  controllers: [DslController],
  providers: [DslService, DslParserService, DslExecutorService],
  exports: [DslService],
})
export class DslModule {}
