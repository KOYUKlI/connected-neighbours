import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Conversation {
  @Prop({ required: true, type: [String] })
  participantIds: string[];

  @Prop({ required: true, type: String, enum: ConversationType })
  type: ConversationType;

  @Prop({ type: String, trim: true, default: null })
  title: string | null;

  @Prop({ type: String, trim: true, default: null })
  contextType: string | null;

  @Prop({ type: String, trim: true, default: null })
  contextId: string | null;

  @Prop({ type: Map, of: Date, default: {} })
  lastReadAt: Map<string, Date>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participantIds: 1 });
