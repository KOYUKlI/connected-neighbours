import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';

import { AnswerVoteDto } from './dto/answer-vote.dto';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteAnswer, VoteAnswerDocument } from './schemas/vote-answer.schema';
import {
  Vote,
  VoteDocument,
  VoteOption,
  VoteStatus,
} from './schemas/vote.schema';

@Injectable()
export class VotesService {
  constructor(
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteAnswer.name)
    private readonly answerModel: Model<VoteAnswerDocument>,
  ) {}

  async create(dto: CreateVoteDto, createdById: string) {
    const options = dto.options.map<VoteOption>((label) => ({
      id: randomUUID(),
      label,
    }));

    return this.voteModel.create({
      question: dto.question,
      neighborhoodId: dto.neighborhoodId,
      createdById,
      options,
      closesAt: dto.closesAt,
      allowMultipleChoices: dto.allowMultipleChoices ?? false,
      status: VoteStatus.OPEN,
    });
  }

  async findAll(neighborhoodId?: string) {
    const filter = neighborhoodId ? { neighborhoodId } : {};
    return this.voteModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const vote = await this.voteModel.findById(id).exec();

    if (!vote) {
      throw new NotFoundException(`Vote ${id} introuvable`);
    }

    return vote;
  }

  async answer(id: string, userId: string, dto: AnswerVoteDto) {
    const vote = await this.findOne(id);

    if (
      vote.status !== VoteStatus.OPEN ||
      vote.closesAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Ce vote est fermé');
    }

    if (!vote.allowMultipleChoices && dto.selectedOptionIds.length > 1) {
      throw new BadRequestException('Ce vote accepte une seule réponse');
    }

    const validOptionIds = new Set(vote.options.map((option) => option.id));
    const hasInvalidOption = dto.selectedOptionIds.some(
      (optionId) => !validOptionIds.has(optionId),
    );

    if (hasInvalidOption) {
      throw new BadRequestException('Option de vote invalide');
    }

    return this.answerModel
      .findOneAndUpdate(
        { voteId: id, userId },
        { voteId: id, userId, selectedOptionIds: dto.selectedOptionIds },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async results(id: string) {
    const vote = await this.findOne(id);
    const answers = await this.answerModel.find({ voteId: id }).exec();
    const counts = new Map(vote.options.map((option) => [option.id, 0]));

    for (const answer of answers) {
      for (const optionId of answer.selectedOptionIds) {
        counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
      }
    }

    return {
      vote,
      totalAnswers: answers.length,
      results: vote.options.map((option) => ({
        option,
        count: counts.get(option.id) ?? 0,
      })),
    };
  }

  async close(id: string) {
    const vote = await this.voteModel
      .findByIdAndUpdate(id, { status: VoteStatus.CLOSED }, { returnDocument: 'after' })
      .exec();

    if (!vote) {
      throw new NotFoundException(`Vote ${id} introuvable`);
    }

    return vote;
  }
}
