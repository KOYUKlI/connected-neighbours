import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SyncStateDocument = HydratedDocument<SyncState>;

export enum SyncStateStatus {
  IDLE = 'idle',
  SUCCESS = 'success',
  ERROR = 'error',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SyncState {
  @Prop({ required: true, trim: true })
  clientId: string;

  @Prop({ type: Date, default: null })
  lastPullAt: Date | null;

  @Prop({ type: Date, default: null })
  lastPushAt: Date | null;

  @Prop({ type: Date, default: null })
  lastSuccessfulSyncAt: Date | null;

  @Prop({
    required: true,
    type: String,
    enum: SyncStateStatus,
    default: SyncStateStatus.IDLE,
  })
  status: SyncStateStatus;

  @Prop({ type: String, trim: true, default: null })
  lastError: string | null;
}

export const SyncStateSchema = SchemaFactory.createForClass(SyncState);

SyncStateSchema.index({ clientId: 1 }, { unique: true });
