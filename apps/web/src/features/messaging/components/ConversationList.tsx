import type { ConversationItem } from '../../../api/messaging';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatTime } from '../../../shared/utils/format';
import { getConversationLabel } from '../conversationLabel';

function getPreview(conversation: ConversationItem) {
  const message = conversation.lastMessage;

  if (!message) {
    return 'Aucun message';
  }

  return message.type === 'vocal' ? 'Message vocal' : message.body;
}

type ConversationListProps = {
  conversations: ConversationItem[];
  currentUserId: string | null;
  isLoading: boolean;
  onSelect: (conversationId: string) => void;
  onStartNew: () => void;
};

export function ConversationList({
  conversations,
  currentUserId,
  isLoading,
  onSelect,
  onStartNew,
}: ConversationListProps) {
  return (
    <div className="chat-widget-list">
      <div className="chat-widget-list-header">
        <h3>Discussions</h3>
        <button className="primary-button chat-widget-new-btn" onClick={onStartNew} type="button">
          Nouvelle discussion
        </button>
      </div>

      {isLoading ? (
        <div className="loading-panel">Chargement...</div>
      ) : conversations.length === 0 ? (
        <EmptyState message="Aucune discussion pour le moment." />
      ) : (
        <ul className="chat-widget-conversations">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                className="chat-widget-conversation-item"
                onClick={() => onSelect(conversation.id)}
                type="button"
              >
                <span className="chat-widget-conversation-name">
                  {getConversationLabel(conversation, currentUserId)}
                </span>
                <span className="chat-widget-conversation-preview">
                  {getPreview(conversation)}
                </span>
                {conversation.lastMessage ? (
                  <span className="chat-widget-conversation-time">
                    {formatTime(conversation.lastMessage.createdAt)}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
