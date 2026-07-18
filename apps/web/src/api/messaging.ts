import { apiRequest } from './client';
import type { AuthUser } from './auth';

export type ConversationType = 'private' | 'group';

export type MessageType = 'write' | 'vocal';

export type MessageAttachment = {
  objectKey: string;
  mimeType: string;
  fileName: string;
  durationSeconds?: number;
  downloadUrl: string;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body: string;
  attachments: MessageAttachment[];
  createdAt?: string;
};

export type ConversationItem = {
  id: string;
  type: ConversationType;
  title: string | null;
  contextType: string | null;
  contextId: string | null;
  participants: AuthUser[];
  lastMessage: MessageItem | null;
  lastReadAt: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

export type ConversationReadPayload = {
  conversationId: string;
  userId: string;
  readAt: string;
};

export type CreateConversationInput = {
  participantIds: string[];
  title?: string;
  contextType?: string;
  contextId?: string;
};

export type SendMessageInput =
  | { type?: 'write'; body: string }
  | {
      type: 'vocal';
      attachment: {
        objectKey: string;
        mimeType: string;
        fileName: string;
        durationSeconds?: number;
      };
    };

export type PresignedUpload = {
  url: string;
  objectKey: string;
  expiresIn: number;
};

export function getMyConversations() {
  return apiRequest<ConversationItem[]>('/api/messaging/conversations');
}

export function createConversation(input: CreateConversationInput) {
  return apiRequest<ConversationItem>('/api/messaging/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMessages(conversationId: string) {
  return apiRequest<MessageItem[]>(
    `/api/messaging/conversations/${conversationId}/messages`,
  );
}

export function sendMessage(conversationId: string, input: SendMessageInput) {
  return apiRequest<MessageItem>(
    `/api/messaging/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function markConversationRead(conversationId: string) {
  return apiRequest<ConversationReadPayload>(
    `/api/messaging/conversations/${conversationId}/read`,
    { method: 'POST' },
  );
}

export function getUploadUrl(fileName: string, mimeType: string) {
  return apiRequest<PresignedUpload>('/api/messaging/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ fileName, mimeType }),
  });
}

export async function uploadFile(uploadUrl: string, file: Blob, mimeType: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Échec de l’envoi du fichier audio');
  }
}
