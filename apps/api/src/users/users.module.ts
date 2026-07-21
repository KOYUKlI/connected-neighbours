import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { PublicUsersService } from './public-users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [PublicUsersService],
  exports: [PublicUsersService],
})
export class UsersModule {}
