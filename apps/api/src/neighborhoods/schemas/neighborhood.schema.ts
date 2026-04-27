import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NeighborhoodDocument = HydratedDocument<Neighborhood>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Neighborhood {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, type: Object })
  boundary: Record<string, unknown>;

  @Prop({ required: true, trim: true })
  createdById: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const NeighborhoodSchema = SchemaFactory.createForClass(Neighborhood);
