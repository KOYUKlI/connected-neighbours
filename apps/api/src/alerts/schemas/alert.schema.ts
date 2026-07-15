import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AlertDocument = HydratedDocument<Alert>;

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  CREATED = 'created',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum AlertSource {
  WEB = 'web',
  ADMIN_WEB = 'admin_web',
  JAVAFX = 'javafx',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Alert {
  @Prop({ required: true, trim: true })
  incidentId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  details: string;

  @Prop({ required: true, type: String, enum: AlertSeverity })
  severity: AlertSeverity;

  @Prop({
    required: true,
    type: String,
    enum: AlertStatus,
    default: AlertStatus.CREATED,
  })
  status: AlertStatus;

  @Prop({
    required: true,
    type: String,
    enum: AlertSource,
    default: AlertSource.WEB,
  })
  source: AlertSource;

  @Prop({ type: String, trim: true, default: null })
  externalId: string | null;

  @Prop({ type: String, trim: true, default: null })
  reportedById: string | null;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

AlertSchema.index({ incidentId: 1, createdAt: -1 });
AlertSchema.index({ status: 1, severity: 1 });
AlertSchema.index(
  { source: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalId: { $type: 'string' },
    },
  },
);
