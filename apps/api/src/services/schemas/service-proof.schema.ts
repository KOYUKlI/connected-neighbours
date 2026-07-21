import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceProofDocument = HydratedDocument<ServiceProof>;

export enum ServiceProofType {
  NOTE = 'note',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ServiceProof {
  @Prop({ required: true, trim: true, index: true })
  serviceId: string;

  @Prop({ required: true, trim: true })
  authorId: string;

  @Prop({ required: true, type: String, enum: ServiceProofType })
  type: ServiceProofType;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  message: string | null;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  fileReference: string | null;
}

export const ServiceProofSchema = SchemaFactory.createForClass(ServiceProof);

ServiceProofSchema.index({ serviceId: 1, createdAt: 1, _id: 1 });
