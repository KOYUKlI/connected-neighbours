import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;

export enum IncidentType {
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  NUISANCE = 'nuisance',
  CLEANLINESS = 'cleanliness',
  TRAFFIC = 'traffic',
  OTHER = 'other',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentSource {
  WEB = 'web',
  ADMIN_WEB = 'admin_web',
  JAVAFX = 'javafx',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Incident {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, type: String, enum: IncidentType })
  type: IncidentType;

  @Prop({
    required: true,
    type: String,
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Prop({ required: true, type: String, enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Prop({ required: true, trim: true })
  neighborhoodId: string;

  @Prop({ type: String, trim: true, default: null })
  reportedById: string | null;

  @Prop({
    required: true,
    type: String,
    enum: IncidentSource,
    default: IncidentSource.WEB,
  })
  source: IncidentSource;

  @Prop({ type: String, trim: true, default: null })
  externalId: string | null;

  @Prop({ type: Date, default: null })
  lastSyncedAt: Date | null;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

IncidentSchema.index({ status: 1, severity: 1 });
IncidentSchema.index({ neighborhoodId: 1, createdAt: -1 });
IncidentSchema.index(
  { source: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalId: { $type: 'string' },
    },
  },
);
