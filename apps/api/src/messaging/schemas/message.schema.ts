import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export type MessageAttachment = {
  objectKey: string;
  mimeType: string;
  fileName: string;
};

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Message {
  @Prop({ required: true, trim: true })
  conversationId: string;

  @Prop({ required: true, trim: true })
  senderId: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ required: true, type: [Object], default: [] })
  attachments: MessageAttachment[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: 1 });
