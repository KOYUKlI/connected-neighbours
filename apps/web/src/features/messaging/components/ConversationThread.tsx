import { useState } from 'react';
import type { FormEvent } from 'react';

import type { ConversationItem, MessageItem } from '../../../api/messaging';
import { getConversationLabel } from '../conversationLabel';
import { MessageBubble } from './MessageBubble';

type ConversationThreadProps = {
  conversation: ConversationItem;
  messages: MessageItem[];
  currentUserId: string | null;
  isLoading: boolean;
  onBack: () => void;
  onSendText: (body: string) => void;
  isRecording: boolean;
  recordError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

export function ConversationThread({
  conversation,
  messages,
  currentUserId,
  isLoading,
  onBack,
  onSendText,
  isRecording,
  recordError,
  onStartRecording,
  onStopRecording,
}: ConversationThreadProps) {
  const [draft, setDraft] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    onSendText(draft.trim());
    setDraft('');
  }

  return (
    <div className="chat-widget-thread">
      <div className="chat-widget-list-header">
        <button className="ghost-button" onClick={onBack} type="button">
          Retour
        </button>
        <h3>{getConversationLabel(conversation, currentUserId)}</h3>
      </div>

      <div className="chat-widget-messages">
        {isLoading ? (
          <div className="loading-panel">Chargement...</div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              isMine={message.senderId === currentUserId}
              key={message.id}
              message={message}
            />
          ))
        )}
      </div>

      {recordError ? <div className="error-banner compact">{recordError}</div> : null}

      <form className="chat-widget-composer" onSubmit={handleSubmit}>
        <input
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Écrire un message..."
          type="text"
          value={draft}
        />
        <button
          className={isRecording ? 'chat-mic-btn chat-mic-btn-active' : 'chat-mic-btn'}
          onClick={isRecording ? onStopRecording : onStartRecording}
          title={isRecording ? 'Arrêter l’enregistrement' : 'Message vocal'}
          type="button"
        >
          {isRecording ? 'Stop' : 'Vocal'}
        </button>
        <button className="primary-button" disabled={!draft.trim()} type="submit">
          Envoyer
        </button>
      </form>
    </div>
  );
}
