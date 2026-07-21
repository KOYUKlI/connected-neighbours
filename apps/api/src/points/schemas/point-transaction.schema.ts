import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PointTransactionDocument = HydratedDocument<PointTransaction>;

export enum PointTransactionType {
  RESERVATION = 'reservation',
  RELEASE = 'release',
  TRANSFER = 'transfer',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class PointTransaction {
  @Prop({ required: true, type: String, enum: PointTransactionType })
  type: PointTransactionType;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ required: true, trim: true })
  serviceId: string;

  @Prop({ required: true, trim: true })
  contractId: string;

  @Prop({ required: true, trim: true })
  fromUserId: string;

  @Prop({ type: String, trim: true, default: null })
  toUserId: string | null;
}

export const PointTransactionSchema =
  SchemaFactory.createForClass(PointTransaction);

PointTransactionSchema.index(
  { contractId: 1, type: 1 },
  { unique: true, name: 'unique_point_operation_per_contract' },
);
