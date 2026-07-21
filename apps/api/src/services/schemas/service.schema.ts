import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

export enum ServiceType {
  OFFER = 'offer',
  REQUEST = 'request',
}

export enum ServiceStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  APPLICATION_RECEIVED = 'application_received',
  CANDIDATE_SELECTED = 'candidate_selected',
  CONTRACT_PENDING = 'contract_pending',
  AWAITING_SIGNATURES = 'awaiting_signatures',
  CONTRACT_ACTIVE = 'contract_active',
  SCHEDULED = 'scheduled',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  AWAITING_VALIDATION = 'awaiting_validation',
  CORRECTION_REQUESTED = 'correction_requested',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Service {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, enum: ServiceType })
  type: ServiceType;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, trim: true })
  availability: string;

  @Prop({ required: true, trim: true })
  neighborhoodId: string;

  @Prop({ required: true, trim: true })
  ownerId: string;

  @Prop({ required: true, default: false })
  isPaid: boolean;

  @Prop({
    type: Number,
    required: function (this: Service) {
      return this.isPaid === true;
    },
    min: 0,
    default: null,
  })
  pricePoints: number | null;

  @Prop({
    required: true,
    type: String,
    enum: ServiceStatus,
    default: ServiceStatus.PUBLISHED,
  })
  status: ServiceStatus;

  @Prop({ type: String, trim: true, default: null })
  selectedApplicationId: string | null;

  @Prop({ type: String, trim: true, default: null })
  contractId: string | null;

  @Prop({ type: String, trim: true, default: null, index: true })
  activeDisputeId: string | null;

  @Prop({ type: Date, default: null })
  scheduledAt: Date | null;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  markedDoneAt: Date | null;

  @Prop({ type: Date, default: null })
  validatedAt: Date | null;

  @Prop({ type: Date, default: null })
  correctionRequestedAt: Date | null;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  correctionReason: string | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null, select: false })
  validationClaimedAt: Date | null;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
