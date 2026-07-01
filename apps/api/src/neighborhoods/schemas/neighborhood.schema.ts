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

  @Prop({ required: true, type: Object })
  boundary: GeoJsonPolygon;

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
}

export const NeighborhoodSchema = SchemaFactory.createForClass(Neighborhood);

NeighborhoodSchema.index({ status: 1, name: 1 });
