import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { DEMO_SEED_SOURCE } from '../demo-seed.manifest';

export type DemoSeedRecordDocument = HydratedDocument<DemoSeedRecord>;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'demo_seed_records',
})
export class DemoSeedRecord {
  @Prop({ required: true, default: DEMO_SEED_SOURCE, index: true })
  seedSource: string;

  @Prop({ required: true, trim: true })
  seedKey: string;

  @Prop({ required: true, trim: true, index: true })
  entityType: string;

  @Prop({ required: true, trim: true, index: true })
  entityId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, string | number | boolean | null>;
}

export const DemoSeedRecordSchema =
  SchemaFactory.createForClass(DemoSeedRecord);

DemoSeedRecordSchema.index(
  { seedSource: 1, seedKey: 1 },
  { unique: true, name: 'unique_demo_seed_key' },
);
DemoSeedRecordSchema.index(
  { seedSource: 1, entityType: 1, entityId: 1 },
  { unique: true, name: 'unique_demo_seed_entity' },
);
