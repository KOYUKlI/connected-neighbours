import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IdentityLinkRequestDocument = HydratedDocument<IdentityLinkRequest>;

export enum IdentityLinkRequestStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

@Schema({ timestamps: true, versionKey: false })
export class IdentityLinkRequest {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: 'keycloak' })
  provider: string;

  @Prop({ required: true, unique: true, select: false })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt: Date | null;

  @Prop({ required: true, default: IdentityLinkRequestStatus.ACTIVE })
  status: IdentityLinkRequestStatus;

  @Prop({ required: true })
  requestedBy: string;
}

export const IdentityLinkRequestSchema =
  SchemaFactory.createForClass(IdentityLinkRequest);

IdentityLinkRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
IdentityLinkRequestSchema.index({ userId: 1, status: 1 });
