import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VoteAnswerDocument = HydratedDocument<VoteAnswer>;

@Schema({ _id: false, versionKey: false })
export class VoteRankingEntry {
  @Prop({ required: true, trim: true })
  optionId: string;

  @Prop({ required: true, min: 1 })
  rank: number;
}

const VoteRankingEntrySchema = SchemaFactory.createForClass(VoteRankingEntry);

@Schema({ timestamps: true, versionKey: false })
export class VoteAnswer {
  @Prop({ required: true, trim: true, index: true })
  voteId: string;

  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ required: true, type: [String] })
  selectedOptionIds: string[];

  @Prop({ type: [VoteRankingEntrySchema], default: [] })
  ranking: VoteRankingEntry[];

  @Prop({ required: true, type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ required: true, min: 1, default: 1 })
  revision: number;
}

export const VoteAnswerSchema = SchemaFactory.createForClass(VoteAnswer);
VoteAnswerSchema.index({ voteId: 1, submittedAt: 1 });
