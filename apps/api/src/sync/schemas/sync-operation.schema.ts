import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SyncOperationDocument = HydratedDocument<SyncOperation>;

export enum SyncEntityType {
  INCIDENT = 'incident',
  ALERT = 'alert',
}

export enum SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
}

export enum SyncOperationStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SyncOperation {
  @Prop({ required: true, trim: true })
  operationId: string;

  @Prop({ required: true, trim: true })
  clientId: string;

  @Prop({ required: true, type: String, enum: SyncEntityType })
  entityType: SyncEntityType;

  @Prop({ type: String, trim: true, default: null })
  entityId: string | null;

  @Prop({ required: true, type: String, enum: SyncOperationType })
  operationType: SyncOperationType;

  @Prop({ required: true, type: Object })
  payload: Record<string, unknown>;

  @Prop({ required: true, type: String, enum: SyncOperationStatus })
  status: SyncOperationStatus;

  @Prop({ type: String, trim: true, default: null })
  error: string | null;

  @Prop({ required: true, type: Date, default: Date.now })
  receivedAt: Date;
}

export const SyncOperationSchema =
  SchemaFactory.createForClass(SyncOperation);

SyncOperationSchema.index({ operationId: 1 }, { unique: true });
SyncOperationSchema.index({ clientId: 1, receivedAt: -1 });
