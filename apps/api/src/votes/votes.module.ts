import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { UsersModule } from '../users/users.module';
import { AdminVotesController } from './admin-votes.controller';
import { VoteAnswer, VoteAnswerSchema } from './schemas/vote-answer.schema';
import { Vote, VoteSchema } from './schemas/vote.schema';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Vote.name, schema: VoteSchema },
      { name: VoteAnswer.name, schema: VoteAnswerSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
    ]),
  ],
  controllers: [VotesController, AdminVotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
