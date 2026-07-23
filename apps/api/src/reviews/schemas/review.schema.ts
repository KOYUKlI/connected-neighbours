import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

export enum ReviewStatus {
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Schema({ _id: false, versionKey: false })
export class ReviewResponse {
  @Prop({ required: true, trim: true })
  authorId: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  message: string;

  @Prop({ required: true })
  respondedAt: Date;
}

const ReviewResponseSchema = SchemaFactory.createForClass(ReviewResponse);

@Schema({ _id: false, versionKey: false })
export class ReviewModerationEntry {
  @Prop({ required: true, enum: ['hidden', 'restored'] })
  action: 'hidden' | 'restored';

  @Prop({ required: true, trim: true })
  moderatorId: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  reason: string;

  @Prop({ required: true })
  createdAt: Date;
}

const ReviewModerationEntrySchema = SchemaFactory.createForClass(
  ReviewModerationEntry,
);

@Schema({ timestamps: true, versionKey: false })
export class Review {
  @Prop({ required: true, trim: true })
  contractId: string;

  @Prop({ required: true, trim: true })
  serviceId: string;

  @Prop({ required: true, trim: true, index: true })
  authorId: string;

  @Prop({ required: true, trim: true, index: true })
  targetUserId: string;

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, trim: true, maxlength: 1000, default: '' })
  comment: string;

  @Prop({
    required: true,
    type: String,
    enum: ReviewStatus,
    default: ReviewStatus.PUBLISHED,
    index: true,
  })
  status: ReviewStatus;

  @Prop({ type: ReviewResponseSchema, default: null })
  response: ReviewResponse | null;

  @Prop({ type: [ReviewModerationEntrySchema], default: [] })
  moderationHistory: ReviewModerationEntry[];

  @Prop({ type: String, trim: true, default: null })
  moderatedById: string | null;

  @Prop({ type: Date, default: null })
  moderatedAt: Date | null;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  moderationReason: string | null;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ contractId: 1, authorId: 1 }, { unique: true });
ReviewSchema.index({ targetUserId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ serviceId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ contractId: 1 });
