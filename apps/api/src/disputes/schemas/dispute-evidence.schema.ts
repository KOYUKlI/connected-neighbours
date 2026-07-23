import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DisputeEvidenceDocument = HydratedDocument<DisputeEvidence>;

export enum DisputeEvidenceType {
  NOTE = 'note',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

@Schema({ timestamps: true, versionKey: false })
export class DisputeEvidence {
  @Prop({ required: true, trim: true, index: true })
  disputeId: string;

  @Prop({ required: true, trim: true })
  authorId: string;

  @Prop({ required: true, type: String, enum: DisputeEvidenceType })
  type: DisputeEvidenceType;

  @Prop({ type: String, trim: true, maxlength: 2000, default: null })
  message: string | null;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  fileReference: string | null;

  @Prop({ type: String, trim: true, default: null })
  fileId: string | null;

  @Prop({ type: String, enum: ['image', 'document', 'audio'], default: null })
  fileKind: 'image' | 'document' | 'audio' | null;

  @Prop({ type: String, trim: true, maxlength: 255, default: null })
  originalFilename: string | null;

  @Prop({ type: String, trim: true, default: null })
  mimeType: string | null;

  @Prop({ type: Number, min: 1, default: null })
  sizeBytes: number | null;

  @Prop({ type: String, trim: true, maxlength: 64, default: null })
  sha256: string | null;

  @Prop({ type: Date, default: null })
  attachmentDeletedAt: Date | null;
}

export const DisputeEvidenceSchema =
  SchemaFactory.createForClass(DisputeEvidence);

DisputeEvidenceSchema.index({ disputeId: 1, createdAt: 1, _id: 1 });
DisputeEvidenceSchema.index(
  { fileId: 1 },
  {
    unique: true,
    partialFilterExpression: { fileId: { $type: 'string' } },
    name: 'unique_file_per_dispute_evidence',
  },
);
