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
