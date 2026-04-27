import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import {
  EventResponse,
  EventResponseSchema,
} from './schemas/event-response.schema';
import { EventSchema, NeighborhoodEvent } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
