import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { UsersModule } from '../users/users.module';
import { AdminEventsController } from './admin-events.controller';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import {
  EventResponse,
  EventResponseSchema,
} from './schemas/event-response.schema';
import { EventSchema, NeighborhoodEvent } from './schemas/event.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
    ]),
  ],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
