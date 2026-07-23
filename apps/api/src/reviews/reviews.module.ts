import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { StorageModule } from '../storage/storage.module';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReputationService } from './reputation.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review, ReviewSchema } from './schemas/review.schema';

@Module({
  imports: [
    StorageModule,
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService, ReputationService],
  exports: [ReviewsService, ReputationService, MongooseModule],
})
export class ReviewsModule {}
