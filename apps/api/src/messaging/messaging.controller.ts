import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Créer une conversation' })
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
  @ApiOperation({ summary: 'Envoyer un message texte' })
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagingService.sendMessage(conversationId, user.sub, dto);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Lire les messages d’une conversation' })
  findMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagingService.findMessages(conversationId, user.sub);
  }
}
