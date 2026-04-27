import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventResponseDocument = HydratedDocument<EventResponse>;

export enum EventInterest {
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  GOING = 'going',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class EventResponse {
  @Prop({ required: true, trim: true })
  eventId: string;

  @Prop({ required: true, trim: true })
  userId: string;

  @Prop({ required: true, type: String, enum: EventInterest })
  interest: EventInterest;
}

export const EventResponseSchema = SchemaFactory.createForClass(EventResponse);
EventResponseSchema.index({ eventId: 1, userId: 1 }, { unique: true });
