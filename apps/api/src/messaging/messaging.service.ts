import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UsersService } from '../auth/users.service';
import { StorageService } from '../storage/storage.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  Conversation,
  ConversationDocument,
  ConversationType,
} from './schemas/conversation.schema';
import {
  Message,
  MessageDocument,
  MessageType,
} from './schemas/message.schema';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  async createConversation(dto: CreateConversationDto, creatorId: string) {
    const participantIds = Array.from(
      new Set([creatorId, ...dto.participantIds]),
    );
    const type =
      participantIds.length <= 2
        ? ConversationType.PRIVATE
        : ConversationType.GROUP;

    if (type === ConversationType.PRIVATE) {
      const existing = await this.conversationModel
        .findOne({
          type: ConversationType.PRIVATE,
          participantIds: {
            $all: participantIds,
            $size: participantIds.length,
          },
        })
        .exec();

      if (existing) {
        return this.enrichConversation(existing);
      }
    }

    const conversation = await this.conversationModel.create({
      participantIds,
      type,
      title: type === ConversationType.GROUP ? (dto.title ?? null) : null,
      contextType: dto.contextType ?? null,
      contextId: dto.contextId ?? null,
    });

    return this.enrichConversation(conversation);
  }

  async findMine(userId: string) {
    const conversations = await this.conversationModel
      .find({ participantIds: userId })
      .sort({ updatedAt: -1 })
      .exec();

    return Promise.all(
      conversations.map((conversation) =>
        this.enrichConversation(conversation),
      ),
    );
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    await this.assertParticipant(conversationId, userId);

    const type = dto.type ?? MessageType.WRITE;

    const message = await this.messageModel.create({
      conversationId,
      senderId: userId,
      type,
      body: type === MessageType.WRITE ? dto.body : '',
      attachments:
        type === MessageType.VOCAL && dto.attachment ? [dto.attachment] : [],
    });

    await this.conversationModel
      .updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } })
      .exec();

    return this.enrichMessage(message);
  }

  async findMessages(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);

    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();

    return Promise.all(messages.map((message) => this.enrichMessage(message)));
  }

  async createUploadUrl(dto: CreateUploadUrlDto) {
    const objectKey = this.storageService.buildObjectKey(
      'messaging/vocal',
      dto.fileName,
    );

    return this.storageService.createUploadUrl(objectKey, dto.mimeType);
  }

  async assertParticipant(conversationId: string, userId: string) {
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

  private async enrichConversation(conversation: ConversationDocument) {
    const [participants, lastMessage] = await Promise.all([
      this.usersService.findByIds(conversation.participantIds),
      this.messageModel
        .findOne({ conversationId: conversation.id })
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      contextType: conversation.contextType,
      contextId: conversation.contextId,
      createdAt: (conversation as unknown as { createdAt?: Date }).createdAt,
      updatedAt: (conversation as unknown as { updatedAt?: Date }).updatedAt,
      participants: participants.map((user) =>
        this.usersService.toPublicUser(user),
      ),
      lastMessage: lastMessage ? await this.enrichMessage(lastMessage) : null,
    };
  }

  private async enrichMessage(message: MessageDocument) {
    const attachments = await Promise.all(
      message.attachments.map(async (attachment) => ({
        ...attachment,
        downloadUrl: await this.storageService.createDownloadUrl(
          attachment.objectKey,
        ),
      })),
    );

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      body: message.body,
      attachments,
      createdAt: (message as unknown as { createdAt?: Date }).createdAt,
    };
  }
}
