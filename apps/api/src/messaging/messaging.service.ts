import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async createConversation(dto: CreateConversationDto, creatorId: string) {
    const participantIds = Array.from(
      new Set([creatorId, ...dto.participantIds]),
    );

    return this.conversationModel.create({
      participantIds,
      contextType: dto.contextType ?? null,
      contextId: dto.contextId ?? null,
    });
  }

  async findMine(userId: string) {
    return this.conversationModel
      .find({ participantIds: userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    await this.assertParticipant(conversationId, userId);

    return this.messageModel.create({
      conversationId,
      senderId: userId,
      body: dto.body,
      attachments: [],
    });
  }

  async findMessages(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);

    return this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} introuvable`);
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Accès interdit à cette conversation');
    }

    return conversation;
  }
}
