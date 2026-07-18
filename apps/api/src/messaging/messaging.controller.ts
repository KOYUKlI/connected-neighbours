import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagingService.createConversation(dto, user.sub);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister mes conversations' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.findMine(user.sub);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Envoyer un message (texte ou vocal)' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const message = await this.messagingService.sendMessage(
      conversationId,
      user.sub,
      dto,
    );

    this.messagingGateway.broadcastMessage(conversationId, message);

    return message;
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Lire les messages d’une conversation' })
  findMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagingService.findMessages(conversationId, user.sub);
  }

  @Post('conversations/:conversationId/read')
  @ApiOperation({ summary: 'Marquer une conversation comme lue' })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const payload = await this.messagingService.markAsRead(
      conversationId,
      user.sub,
    );

    this.messagingGateway.broadcastRead(conversationId, payload);

    return payload;
  }

  @Post('uploads/presign')
  @ApiOperation({ summary: 'Obtenir une URL présignée pour uploader un vocal' })
  createUploadUrl(@Body() dto: CreateUploadUrlDto) {
    return this.messagingService.createUploadUrl(dto);
  }
}
