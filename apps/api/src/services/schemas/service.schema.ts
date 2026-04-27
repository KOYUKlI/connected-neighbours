import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

export enum ServiceType {
  OFFER = 'offer',
  REQUEST = 'request',
}

export enum ServiceStatus {
  PUBLISHED = 'published',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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
    enum: ServiceStatus,
    default: ServiceStatus.PUBLISHED,
  })
  status: ServiceStatus;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
