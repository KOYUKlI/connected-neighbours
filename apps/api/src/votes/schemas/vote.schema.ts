import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VoteDocument = HydratedDocument<Vote>;

export enum VoteBallotType {
  YES_NO = 'yes_no',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  RANKING = 'ranking',
}

export enum VotePrivacy {
  ANONYMOUS = 'anonymous',
  PUBLIC = 'public',
}

export enum VoteResultsVisibility {
  ALWAYS = 'always',
  AFTER_SUBMISSION = 'after_submission',
  AFTER_CLOSE = 'after_close',
}

export enum VoteStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export enum VoteAuditType {
  CREATED = 'created',
  SCHEDULED = 'scheduled',
  OPENED = 'opened',
  UPDATED = 'updated',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

@Schema({ _id: false, versionKey: false })
export class VoteOption {
  @Prop({ required: true, trim: true })
  id: string;

  @Prop({ required: true, trim: true, maxlength: 240 })
  label: string;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  description: string | null;

  @Prop({ required: true, min: 0 })
  order: number;
}

const VoteOptionSchema = SchemaFactory.createForClass(VoteOption);

@Schema({ _id: false, versionKey: false })
export class VoteAuditEntry {
  @Prop({ required: true, type: String, enum: VoteAuditType })
  type: VoteAuditType;

  @Prop({ required: true, trim: true })
  actorId: string;

  @Prop({ required: true, type: Date })
  occurredAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, string | number | boolean | null>;
}

const VoteAuditEntrySchema = SchemaFactory.createForClass(VoteAuditEntry);

@Schema({ timestamps: true, versionKey: false })
export class Vote {
  @Prop({ required: false, trim: true, maxlength: 180 })
  title?: string;

  /** Ancien champ lu par le normalisateur, jamais écrit par les nouvelles créations. */
  @Prop({ required: false, trim: true, maxlength: 180 })
  question?: string;

  @Prop({ required: false, trim: true, maxlength: 4000, default: '' })
  description: string;

  @Prop({ required: true, trim: true, index: true })
  neighborhoodId: string;

  @Prop({ required: true, trim: true, index: true })
  createdById: string;

  @Prop({ required: false, type: String, enum: VoteBallotType })
  ballotType?: VoteBallotType;

  @Prop({ required: false, type: String, enum: VotePrivacy })
  privacy?: VotePrivacy;

  @Prop({ required: false, type: String, enum: VoteResultsVisibility })
  resultsVisibility?: VoteResultsVisibility;

  @Prop({ required: true, type: [VoteOptionSchema] })
  options: VoteOption[];

  @Prop({ type: Number, min: 1, default: null })
  minSelections: number | null;

  @Prop({ type: Number, min: 1, default: null })
  maxSelections: number | null;

  @Prop({ required: false, default: false })
  allowAnswerChange?: boolean;

  /** Ancien indicateur lu uniquement pour déduire le type de bulletin. */
  @Prop({ required: false, default: undefined })
  allowMultipleChoices?: boolean;

  @Prop({ required: false, type: Date })
  opensAt?: Date;

  @Prop({ required: true, type: Date, index: true })
  closesAt: Date;

  @Prop({
    required: true,
    type: String,
    enum: VoteStatus,
    default: VoteStatus.DRAFT,
    index: true,
  })
  status: VoteStatus;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;

  @Prop({ type: Date, default: null })
  closedAt: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: Date, default: null })
  archivedAt: Date | null;

  @Prop({ type: [VoteAuditEntrySchema], default: [] })
  history: VoteAuditEntry[];
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

VoteSchema.index({ neighborhoodId: 1, status: 1, opensAt: 1, closesAt: 1 });
VoteSchema.index({ createdById: 1, createdAt: -1 });
