import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import {
  PointTransaction,
  PointTransactionSchema,
} from './schemas/point-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: PointTransaction.name,
        schema: PointTransactionSchema,
      },
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
