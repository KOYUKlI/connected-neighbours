import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ManagedDocumentDocument = HydratedDocument<ManagedDocument>;

export enum ManagedDocumentStatus {
  DRAFT = 'draft',
  UPLOADED = 'uploaded',
  PREPARED = 'prepared',
  SENT_FOR_SIGNATURE = 'sent_for_signature',
  PARTIALLY_SIGNED = 'partially_signed',
  SIGNED = 'signed',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

export enum ManagedDocumentType {
  CONTRACT = 'contract',
  IMPORTED_DOCUMENT = 'imported_document',
}

export enum SignatureFieldType {
  SIGNATURE = 'signature',
  INITIALS = 'initials',
  DATE = 'date',
  TEXT = 'text',
  CHECKBOX = 'checkbox',
}

export enum DocumentSignerStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
}

export type SignatureField = {
  id: string;
  type: SignatureFieldType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedToUserId: string;
  required: boolean;
  label?: string | null;
  signedAt?: Date | null;
  value?: string | boolean | null;
  signatureId?: string | null;
};

export type DocumentSigner = {
  userId: string;
  status: DocumentSignerStatus;
  signedAt?: Date | null;
};

export type DocumentSignatureEvent = {
  id: string;
  signerId: string;
  fieldIds: string[];
  signedAt: Date;
  sourceSha256: string;
  resultSha256: string;
  documentVersion: number;
  consentVersion: string;
  auditReference: string;
};

export type DocumentAuditEntry = {
  action: string;
  actorId: string;
  at: Date;
  metadata?: Record<string, string | number | boolean | null>;
  internal?: boolean;
};

export type SignatureClaim = {
  userId: string;
  claimedAt: Date;
  sourceVersion: number;
} | null;

@Schema({ timestamps: true, versionKey: false })
export class ManagedDocument {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, type: String, enum: ManagedDocumentType })
  type: ManagedDocumentType;

  @Prop({ required: true, trim: true, index: true })
  contractId: string;

  @Prop({ required: true, trim: true, index: true })
  serviceId: string;

  @Prop({ required: true, trim: true, index: true })
  ownerId: string;

  @Prop({
    required: true,
    type: String,
    enum: ManagedDocumentStatus,
    default: ManagedDocumentStatus.DRAFT,
  })
  status: ManagedDocumentStatus;

  @Prop({ required: true, trim: true })
  originalFileId: string;

  @Prop({ required: true, trim: true })
  currentFileId: string;

  @Prop({ type: String, trim: true, default: null })
  finalFileId: string | null;

  @Prop({ required: true, trim: true })
  originalSha256: string;

  @Prop({ required: true, trim: true })
  currentSha256: string;

  @Prop({ type: String, trim: true, default: null })
  finalSha256: string | null;

  @Prop({ required: true, min: 1 })
  pageCount: number;

  @Prop({ required: true, type: [Object], default: [] })
  fields: SignatureField[];

  @Prop({ required: true, type: [Object], default: [] })
  signers: DocumentSigner[];

  @Prop({ required: true, type: [Object], default: [] })
  signatures: DocumentSignatureEvent[];

  @Prop({ required: true, type: [Object], default: [] })
  auditTrail: DocumentAuditEntry[];

  @Prop({ required: true, min: 1, default: 1 })
  version: number;

  @Prop({ type: Object, default: null })
  signatureClaim: SignatureClaim;

  @Prop({ type: Date, default: null })
  sentForSignatureAt: Date | null;

  @Prop({ type: Date, default: null })
  finalizedAt: Date | null;

  @Prop({ type: Date, default: null })
  archivedAt: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: String, trim: true, default: null })
  fileName?: string | null;

  @Prop({ type: String, trim: true, default: null })
  objectKey?: string | null;
}

export const ManagedDocumentSchema =
  SchemaFactory.createForClass(ManagedDocument);
ManagedDocumentSchema.index({ status: 1, createdAt: -1 });
ManagedDocumentSchema.index(
  { contractId: 1 },
  {
    unique: true,
    name: 'unique_active_contract_document',
    partialFilterExpression: {
      status: {
        $in: [
          ManagedDocumentStatus.DRAFT,
          ManagedDocumentStatus.UPLOADED,
          ManagedDocumentStatus.PREPARED,
          ManagedDocumentStatus.SENT_FOR_SIGNATURE,
          ManagedDocumentStatus.PARTIALLY_SIGNED,
          ManagedDocumentStatus.SIGNED,
          ManagedDocumentStatus.FINALIZED,
          ManagedDocumentStatus.ARCHIVED,
        ],
      },
    },
  },
);
