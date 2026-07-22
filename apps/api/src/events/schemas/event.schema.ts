import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<NeighborhoodEvent>;

export enum EventCategory {
  WORKSHOP = 'workshop',
  PARTY = 'party',
  FUNDRAISING = 'fundraising',
  SPORT = 'sport',
  COMMUNITY_MEETING = 'community_meeting',
  CHILDREN = 'children',
  CULTURE = 'culture',
  HELP = 'help',
  EMERGENCY = 'emergency',
  OTHER = 'other',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OPEN_REGISTRATION = 'open_registration',
  FULL = 'full',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
  /** Ancien statut accepté uniquement lors de la lecture des données existantes. */
  SCHEDULED = 'scheduled',
}

export enum EventAuditType {
  CREATED = 'created',
  PUBLISHED = 'published',
  UPDATED = 'updated',
  CANCELLED = 'cancelled',
  STARTED = 'started',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Schema({ _id: false, versionKey: false })
export class EventAuditEntry {
  @Prop({ required: true, type: String, enum: EventAuditType })
  type: EventAuditType;

  @Prop({ required: true, trim: true })
  actorId: string;

  @Prop({ required: true, type: Date })
  occurredAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, string | number | boolean | null>;
}

const EventAuditEntrySchema = SchemaFactory.createForClass(EventAuditEntry);

@Schema({ timestamps: true, versionKey: false })
export class NeighborhoodEvent {
  @Prop({ required: true, trim: true, maxlength: 140 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  description: string;

  @Prop({ required: true, type: String, enum: EventCategory })
  category: EventCategory;

  @Prop({ required: true, trim: true, index: true })
  neighborhoodId: string;

  @Prop({ required: true, trim: true, index: true })
  organizerId: string;

  /** Nom historique conservé comme source de vérité pour les dates. */
  @Prop({ required: true, type: Date, index: true })
  startsAt: Date;

  @Prop({ required: true, type: Date })
  endsAt: Date;

  @Prop({ type: Date, default: null })
  registrationDeadline: Date | null;

  @Prop({ required: true, trim: true, maxlength: 240 })
  locationLabel: string;

  @Prop({ type: Number, min: 1, default: null })
  capacity: number | null;

  @Prop({ type: Number, min: 0, default: 0 })
  participantCount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  waitlistCount: number;

  @Prop({ type: Number, min: 0, default: 0, select: false })
  waitlistSequence: number;

  @Prop({ type: Boolean, default: false, select: false })
  countersInitialized: boolean;

  @Prop({ type: Number, min: 0, max: 120, default: null })
  minimumAge: number | null;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  accessibilityInformation: string | null;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  equipmentInformation: string | null;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  contactInstructions: string | null;

  @Prop({
    required: true,
    type: String,
    enum: EventStatus,
    default: EventStatus.DRAFT,
    index: true,
  })
  status: EventStatus;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  cancellationReason: string | null;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  archivedAt: Date | null;

  @Prop({ type: [EventAuditEntrySchema], default: [] })
  history: EventAuditEntry[];
}

export const EventSchema = SchemaFactory.createForClass(NeighborhoodEvent);

EventSchema.index({ neighborhoodId: 1, status: 1, startsAt: 1 });
EventSchema.index({ organizerId: 1, createdAt: -1 });
