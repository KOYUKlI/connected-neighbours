import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { ServiceStatus } from '../../services/schemas/service.schema';

export type DisputeDocument = HydratedDocument<Dispute>;

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum DisputeReason {
  SERVICE_NOT_COMPLETED = 'service_not_completed',
  SERVICE_QUALITY = 'service_quality',
  NO_SHOW = 'no_show',
  INCORRECT_DESCRIPTION = 'incorrect_description',
  UNSAFE_BEHAVIOR = 'unsafe_behavior',
  PAYMENT_DISAGREEMENT = 'payment_disagreement',
  OTHER = 'other',
}

export enum DisputeOutcome {
  PROVIDER_PAYMENT = 'provider_payment',
  REQUESTER_REFUND = 'requester_refund',
  SPLIT = 'split',
  OTHER = 'other',
}

export enum DisputeResolutionType {
  PROVIDER_PAYMENT = 'provider_payment',
  REQUESTER_REFUND = 'requester_refund',
  SPLIT = 'split',
}

export enum DisputeAuditEventType {
  OPENED = 'opened',
  EVIDENCE_ADDED = 'evidence_added',
  MODERATOR_ASSIGNED = 'moderator_assigned',
  REVIEW_STARTED = 'review_started',
  RESOLVED = 'resolved',
  FINANCIAL_OPERATION_COMPLETED = 'financial_operation_completed',
  CLOSED = 'closed',
}

@Schema({ _id: false, versionKey: false })
export class DisputeAuditEvent {
  @Prop({ required: true, type: String, enum: DisputeAuditEventType })
  type: DisputeAuditEventType;

  @Prop({ required: true, trim: true })
  actorId: string;

  @Prop({ required: true, type: Date })
  occurredAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, string | number | boolean | null>;
}

const DisputeAuditEventSchema = SchemaFactory.createForClass(DisputeAuditEvent);

@Schema({ _id: false, versionKey: false })
export class DisputeResolution {
  @Prop({ required: true, type: String, enum: DisputeResolutionType })
  type: DisputeResolutionType;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  justification: string;

  @Prop({ required: true, min: 0 })
  providerPoints: number;

  @Prop({ required: true, min: 0 })
  requesterPoints: number;

  @Prop({ required: true, trim: true })
  resolvedById: string;

  @Prop({ required: true, type: Date })
  resolvedAt: Date;
}

const DisputeResolutionSchema = SchemaFactory.createForClass(DisputeResolution);

@Schema({ timestamps: true, versionKey: false })
export class Dispute {
  @Prop({ required: true, trim: true, index: true })
  serviceId: string;

  @Prop({ required: true, trim: true, index: true })
  contractId: string;

  @Prop({ required: true, trim: true, index: true })
  openedById: string;

  @Prop({ required: true, type: String, enum: DisputeReason })
  reason: DisputeReason;

  @Prop({ required: true, trim: true, minlength: 20, maxlength: 2000 })
  description: string;

  @Prop({ type: String, enum: DisputeOutcome, default: null })
  requestedOutcome: DisputeOutcome | null;

  @Prop({
    required: true,
    type: String,
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Prop({ type: String, trim: true, default: null, index: true })
  assignedModeratorId: string | null;

  @Prop({ required: true, type: String, enum: ServiceStatus })
  previousServiceStatus: ServiceStatus;

  @Prop({ required: true, min: 1 })
  reservedPoints: number;

  @Prop({ required: true, type: Date })
  openedAt: Date;

  @Prop({ type: Date, default: null })
  assignedAt: Date | null;

  @Prop({ type: Date, default: null })
  reviewStartedAt: Date | null;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: Date, default: null })
  closedAt: Date | null;

  @Prop({ type: DisputeResolutionSchema, default: null })
  resolution: DisputeResolution | null;

  @Prop({ type: Date, default: null, select: false })
  resolutionClaimedAt: Date | null;

  @Prop({ type: [DisputeAuditEventSchema], default: [] })
  history: DisputeAuditEvent[];
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);

DisputeSchema.index({ status: 1, openedAt: -1 });
DisputeSchema.index(
  { contractId: 1 },
  {
    unique: true,
    name: 'unique_active_dispute_per_contract',
    partialFilterExpression: { resolvedAt: null },
  },
);
