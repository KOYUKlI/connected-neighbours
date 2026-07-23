import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { GraphEntityType, GraphSyncOperation } from '../graph.types';

export enum GraphSyncJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type GraphSyncJobDocument = HydratedDocument<GraphSyncJob>;

@Schema({ timestamps: true, versionKey: false })
export class GraphSyncJob {
  @Prop({ required: true, type: String, enum: GraphEntityType, index: true })
  entityType: GraphEntityType;

  @Prop({ required: true, trim: true, index: true })
  entityId: string;

  @Prop({ required: true, type: String, enum: GraphSyncOperation })
  operation: GraphSyncOperation;

  @Prop({
    required: true,
    type: String,
    enum: GraphSyncJobStatus,
    default: GraphSyncJobStatus.PENDING,
    index: true,
  })
  status: GraphSyncJobStatus;

  @Prop({ required: true, min: 0, default: 0 })
  attempts: number;

  @Prop({ type: String, trim: true, default: null })
  lastErrorCode: string | null;

  @Prop({ type: Date, default: Date.now, index: true })
  nextAttemptAt: Date;

  @Prop({ type: Date, default: null, index: true })
  lockedUntil: Date | null;

  @Prop({ type: String, trim: true, default: null })
  workerId: string | null;

  @Prop({ type: Boolean, default: false })
  rerunRequested: boolean;

  @Prop({ type: String, trim: true, default: null })
  activeKey: string | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;
}

export const GraphSyncJobSchema = SchemaFactory.createForClass(GraphSyncJob);

GraphSyncJobSchema.index(
  { activeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { activeKey: { $type: 'string' } },
  },
);
GraphSyncJobSchema.index({ status: 1, nextAttemptAt: 1, lockedUntil: 1 });
