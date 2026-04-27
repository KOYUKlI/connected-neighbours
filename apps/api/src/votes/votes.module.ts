import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VoteAnswer, VoteAnswerSchema } from './schemas/vote-answer.schema';
import { Vote, VoteSchema } from './schemas/vote.schema';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vote.name, schema: VoteSchema },
      { name: VoteAnswer.name, schema: VoteAnswerSchema },
    ]),
  ],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
