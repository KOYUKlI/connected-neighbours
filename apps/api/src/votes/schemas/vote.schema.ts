import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VoteDocument = HydratedDocument<Vote>;

export enum VoteStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export type VoteOption = {
  id: string;
  label: string;
};

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Vote {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ required: true, trim: true })
  neighborhoodId: string;

  @Prop({ required: true, trim: true })
  createdById: string;

  @Prop({ required: true, type: [Object] })
  options: VoteOption[];

  @Prop({ required: true, type: Date })
  closesAt: Date;

  @Prop({ required: true, default: false })
  allowMultipleChoices: boolean;

  @Prop({
    required: true,
    type: String,
    enum: VoteStatus,
    default: VoteStatus.OPEN,
  })
  status: VoteStatus;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);
