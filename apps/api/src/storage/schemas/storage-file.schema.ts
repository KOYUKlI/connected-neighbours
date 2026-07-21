import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StorageFileDocument = HydratedDocument<StorageFile>;

export enum StorageFileStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  DELETED = 'deleted',
  REJECTED = 'rejected',
}

export enum StorageContextType {
  CONTRACT_DOCUMENT = 'contract_document',
  DOCUMENT_REVISION = 'document_revision',
  DOCUMENT_FINAL = 'document_final',
  SERVICE_PROOF = 'service_proof',
  DISPUTE_EVIDENCE = 'dispute_evidence',
}

@Schema({ timestamps: true, versionKey: false })
export class StorageFile {
  @Prop({ required: true, trim: true })
  bucket: string;

  @Prop({ required: true, trim: true, unique: true })
  objectKey: string;

  @Prop({ required: true, trim: true })
  originalFilename: string;

  @Prop({ required: true, trim: true })
  safeFilename: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ required: true, min: 1 })
  sizeBytes: number;

  @Prop({ type: String, trim: true, default: null })
  sha256: string | null;

  @Prop({ required: true, trim: true, index: true })
  ownerId: string;

  @Prop({ required: true, type: String, enum: StorageContextType, index: true })
  contextType: StorageContextType;

  @Prop({ required: true, trim: true, index: true })
  contextId: string;

  @Prop({
    required: true,
    type: String,
    enum: StorageFileStatus,
    default: StorageFileStatus.PENDING,
  })
  status: StorageFileStatus;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const StorageFileSchema = SchemaFactory.createForClass(StorageFile);
StorageFileSchema.index({ contextType: 1, contextId: 1, createdAt: -1 });
