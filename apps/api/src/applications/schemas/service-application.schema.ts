import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceApplicationDocument = HydratedDocument<ServiceApplication>;

export enum ServiceApplicationStatus {
  SUBMITTED = 'submitted',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export const ActiveServiceApplicationStatuses = [
  ServiceApplicationStatus.SUBMITTED,
  ServiceApplicationStatus.VIEWED,
  ServiceApplicationStatus.ACCEPTED,
];

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ServiceApplication {
  @Prop({ required: true, trim: true })
  serviceId: string;

  @Prop({ required: true, trim: true })
  applicantId: string;

  @Prop({ required: true, trim: true })
  ownerId: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: Date, default: null })
  proposedDate: Date | null;

  @Prop({ type: Number, min: 0, default: null })
  proposedPricePoints: number | null;

  @Prop({
    required: true,
    type: String,
    enum: ServiceApplicationStatus,
    default: ServiceApplicationStatus.SUBMITTED,
  })
  status: ServiceApplicationStatus;

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: Date, default: null })
  rejectedAt: Date | null;
}

export const ServiceApplicationSchema =
  SchemaFactory.createForClass(ServiceApplication);

ServiceApplicationSchema.index(
  { serviceId: 1, applicantId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ActiveServiceApplicationStatuses },
    },
  },
);
