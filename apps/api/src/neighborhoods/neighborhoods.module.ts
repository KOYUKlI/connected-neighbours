import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { EventSchema, NeighborhoodEvent } from '../events/schemas/event.schema';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Vote, VoteSchema } from '../votes/schemas/vote.schema';
import { AdminNeighborhoodsController } from './admin-neighborhoods.controller';
import { NeighborhoodsController } from './neighborhoods.controller';
import { NeighborhoodsService } from './neighborhoods.service';
import {
  Neighborhood,
  NeighborhoodSchema,
} from './schemas/neighborhood.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Neighborhood.name, schema: NeighborhoodSchema },
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: NeighborhoodEvent.name, schema: EventSchema },
      { name: Vote.name, schema: VoteSchema },
    ]),
  ],
  controllers: [NeighborhoodsController, AdminNeighborhoodsController],
  providers: [NeighborhoodsService],
  exports: [NeighborhoodsService],
})
export class NeighborhoodsModule {}
