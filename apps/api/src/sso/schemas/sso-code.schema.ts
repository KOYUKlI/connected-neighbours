import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SsoCodeDocument = HydratedDocument<SsoCode>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SsoCode {
  @Prop({ required: true, trim: true, unique: true })
  code: string;

  @Prop({ required: true, trim: true })
  userId: string;

  @Prop({ required: true, trim: true })
  codeChallenge: string;

  @Prop({ required: true, type: Boolean, default: false })
  used: boolean;

  @Prop({ required: true, type: Date })
  expiresAt: Date;
}

export const SsoCodeSchema = SchemaFactory.createForClass(SsoCode);

SsoCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
