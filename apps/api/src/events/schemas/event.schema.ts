import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<NeighborhoodEvent>;

export enum EventStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class NeighborhoodEvent {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, trim: true })
  neighborhoodId: string;

  @Prop({ required: true, trim: true })
  organizerId: string;

  @Prop({ required: true, type: Date })
  startsAt: Date;

  @Prop({ required: true, trim: true })
  locationLabel: string;

  @Prop({
    required: true,
    type: String,
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  status: EventStatus;
}

export const EventSchema = SchemaFactory.createForClass(NeighborhoodEvent);
