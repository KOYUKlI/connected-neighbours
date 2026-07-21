import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContractDocument = HydratedDocument<Contract>;

export enum ContractStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Contract {
  @Prop({ required: true, trim: true })
  serviceId: string;

  @Prop({ type: String, trim: true, default: null })
  applicationId: string | null;

  @Prop({ required: true, trim: true })
  requesterId: string;

  @Prop({ required: true, trim: true })
  providerId: string;

  @Prop({ required: true, trim: true })
  payerId: string;

  @Prop({ required: true, trim: true })
  receiverId: string;

  @Prop({ required: true, min: 0 })
  pricePoints: number;

  @Prop({
    required: true,
    type: String,
    enum: ContractStatus,
    default: ContractStatus.SENT,
  })
  status: ContractStatus;

  @Prop({ type: [String], default: [] })
  signedByIds: string[];

  @Prop({ type: Date, default: null })
  signedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: String, trim: true, default: null, index: true })
  activeDisputeId: string | null;

  @Prop({ type: String, trim: true, default: null, index: true })
  documentId: string | null;

  @Prop({ type: String, trim: true, default: null })
  finalizedDocumentFileId: string | null;

  @Prop({ type: String, trim: true, default: null })
  documentFinalSha256: string | null;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index(
  { serviceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $nin: [ContractStatus.CANCELLED] },
    },
  },
);

ContractSchema.index(
  { applicationId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      applicationId: { $type: 'string' },
      status: { $nin: [ContractStatus.CANCELLED] },
    },
  },
);
