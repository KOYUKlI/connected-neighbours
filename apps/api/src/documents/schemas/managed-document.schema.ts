import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ManagedDocumentDocument = HydratedDocument<ManagedDocument>;

export enum ManagedDocumentStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  SIGNED = 'signed',
  ARCHIVED = 'archived',
}

export enum SignatureFieldType {
  SIGNATURE = 'signature',
  INITIALS = 'initials',
}

export type SignatureField = {
  id: string;
  type: SignatureFieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedToUserId: string;
  signedByUserId?: string;
  signedAt?: Date;
};

export type DocumentAuditEntry = {
  action: string;
  userId: string;
  at: Date;
  fieldId?: string;
};

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ManagedDocument {
  @Prop({ required: true, trim: true })
  fileName: string;

  @Prop({ required: true, trim: true })
  objectKey: string;

  @Prop({ required: true, trim: true, default: 'application/pdf' })
  mimeType: string;

  @Prop({ required: true, trim: true })
  ownerId: string;

  @Prop({ type: String, trim: true, default: null })
  contextType: string | null;

  @Prop({ type: String, trim: true, default: null })
  contextId: string | null;

  @Prop({
    required: true,
    type: String,
    enum: ManagedDocumentStatus,
    default: ManagedDocumentStatus.DRAFT,
  })
  status: ManagedDocumentStatus;

  @Prop({ required: true, type: [Object], default: [] })
  fields: SignatureField[];

  @Prop({ required: true, type: [Object], default: [] })
  auditTrail: DocumentAuditEntry[];
}

export const ManagedDocumentSchema =
  SchemaFactory.createForClass(ManagedDocument);
