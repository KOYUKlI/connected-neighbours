import type { ConversationItem } from '../../api/messaging';

export function getConversationLabel(
  conversation: ConversationItem,
  currentUserId: string | null,
) {
  if (conversation.type === 'group') {
    return conversation.title ?? conversation.participants.map((p) => p.displayName).join(', ');
  }

  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.displayName ?? 'Discussion';
}

export function isConversationUnread(
  conversation: ConversationItem,
  currentUserId: string | null,
) {
  const lastMessage = conversation.lastMessage;

  if (!lastMessage || !currentUserId || lastMessage.senderId === currentUserId) {
    return false;
  }

  const readAt = conversation.lastReadAt[currentUserId];

  if (!readAt) {
    return true;
  }

  return new Date(lastMessage.createdAt ?? 0) > new Date(readAt);
}
