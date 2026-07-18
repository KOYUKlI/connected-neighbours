import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { MessagingService } from './messaging.service';

function readCorsOrigins() {
  const raw =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174';

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  namespace: '/messaging',
  path: '/api/socket.io',
  cors: {
    origin: readCorsOrigins(),
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      client.data.user = payload;
    } catch {
      this.logger.warn(`Connexion WebSocket refusée (token invalide)`);
      client.disconnect();
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('conversation:join')
  async handleJoin(client: Socket, conversationId: string) {
    const user = client.data.user as AuthenticatedUser | undefined;

    if (!user) {
      return;
    }

    await this.messagingService.assertParticipant(conversationId, user.sub);
    await client.join(conversationId);
  }

  @SubscribeMessage('conversation:leave')
  handleLeave(client: Socket, conversationId: string) {
    void client.leave(conversationId);
  }

  broadcastMessage(conversationId: string, message: unknown) {
    this.server.to(conversationId).emit('message:new', message);
  }

  broadcastRead(conversationId: string, payload: unknown) {
    this.server.to(conversationId).emit('conversation:read', payload);
  }
}
