import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Conversation {
  @Prop({ required: true, type: [String] })
  participantIds: string[];

  @Prop({ type: String, trim: true, default: null })
  contextType: string | null;

  @Prop({ type: String, trim: true, default: null })
  contextId: string | null;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participantIds: 1 });
