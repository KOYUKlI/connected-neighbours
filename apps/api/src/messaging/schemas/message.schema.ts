import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  WRITE = 'write',
  VOCAL = 'vocal',
}

export type MessageAttachment = {
  objectKey: string;
  mimeType: string;
  fileName: string;
  durationSeconds?: number;
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

  @Prop({
    required: true,
    type: String,
    enum: MessageType,
    default: MessageType.WRITE,
  })
  type: MessageType;

  @Prop({ type: String, trim: true, default: '' })
  body: string;

  @Prop({ required: true, type: [Object], default: [] })
  attachments: MessageAttachment[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: 1 });
