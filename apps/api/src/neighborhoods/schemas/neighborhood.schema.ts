import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NeighborhoodDocument = HydratedDocument<Neighborhood>;

export enum NeighborhoodStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export type GeoJsonPosition = [number, number];

export type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: GeoJsonPosition[][];
};

export type GeoJsonPoint = {
  type: 'Point';
  coordinates: GeoJsonPosition;
};

export enum NeighborhoodAuditType {
  CREATED = 'created',
  UPDATED = 'updated',
  ARCHIVED = 'archived',
  RESTORED = 'restored',
  USER_ASSIGNED = 'user_assigned',
}

export type NeighborhoodAuditEntry = {
  type: NeighborhoodAuditType;
  actorId: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
};

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Neighborhood {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  postalCode: string;

  @Prop({ type: [String], default: [] })
  postalCodes: string[];

  @Prop({ required: false, type: Object, default: null })
  boundary: GeoJsonPolygon | null;

  @Prop({ required: false, type: Object, default: null })
  geometry: GeoJsonPolygon | null;

  @Prop({ required: false, type: Object, default: null })
  center: GeoJsonPoint | null;

  @Prop({ required: true, trim: true })
  createdById: string;

  @Prop({
    required: true,
    type: String,
    enum: NeighborhoodStatus,
    default: NeighborhoodStatus.ACTIVE,
  })
  status: NeighborhoodStatus;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  archivedAt: Date | null;

  @Prop({ type: [Object], default: [] })
  history: NeighborhoodAuditEntry[];
}

export const NeighborhoodSchema = SchemaFactory.createForClass(Neighborhood);

NeighborhoodSchema.index({ status: 1, name: 1 });
NeighborhoodSchema.index({ geometry: '2dsphere' }, { sparse: true });
NeighborhoodSchema.index({ city: 1, postalCodes: 1, status: 1 });
