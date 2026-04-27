import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VoteAnswerDocument = HydratedDocument<VoteAnswer>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class VoteAnswer {
  @Prop({ required: true, trim: true })
  voteId: string;

  @Prop({ required: true, trim: true })
  userId: string;

  @Prop({ required: true, type: [String] })
  selectedOptionIds: string[];
}

export const VoteAnswerSchema = SchemaFactory.createForClass(VoteAnswer);
VoteAnswerSchema.index({ voteId: 1, userId: 1 }, { unique: true });
