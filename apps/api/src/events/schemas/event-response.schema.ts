import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventResponseDocument = HydratedDocument<EventResponse>;

export enum EventResponseStatus {
  INTERESTED = 'interested',
  GOING = 'going',
  MAYBE = 'maybe',
  NOT_INTERESTED = 'not_interested',
  CANCELLED = 'cancelled',
  WAITLISTED = 'waitlisted',
}

/** Alias conservé pour les anciens imports et payloads. */
export const EventInterest = EventResponseStatus;
export type EventInterest = EventResponseStatus;

@Schema({ timestamps: true, versionKey: false })
export class EventResponse {
  @Prop({ required: true, trim: true, index: true })
  eventId: string;

  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ required: false, type: String, enum: EventResponseStatus })
  response?: EventResponseStatus;

  /** Ancien champ lu par le normalisateur, jamais écrit par les nouvelles mutations. */
  @Prop({ required: false, type: String, enum: EventResponseStatus })
  interest?: EventResponseStatus;

  @Prop({ required: true, type: Date, default: Date.now })
  respondedAt: Date;

  @Prop({ type: Number, min: 1, default: null })
  waitlistPosition: number | null;

  @Prop({ type: Date, default: null })
  promotedAt: Date | null;

  @Prop({ type: Number, min: 0, default: 0 })
  revision: number;

  @Prop({ type: String, default: null, select: false })
  mutationClaim: string | null;

  @Prop({ type: Date, default: null, select: false })
  mutationClaimedAt: Date | null;
}

export const EventResponseSchema = SchemaFactory.createForClass(EventResponse);
EventResponseSchema.index({ eventId: 1, response: 1, respondedAt: 1, _id: 1 });
