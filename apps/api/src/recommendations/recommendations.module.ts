import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { EventsModule } from '../events/events.module';
import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    ServicesModule,
    EventsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
