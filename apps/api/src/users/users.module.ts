import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ReviewsModule } from '../reviews/reviews.module';
import { StorageModule } from '../storage/storage.module';
import { PublicUsersService } from './public-users.service';
import { UserProfilesService } from './user-profiles.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ReviewsModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [PublicUsersService, UserProfilesService],
  exports: [PublicUsersService],
})
export class UsersModule {}
