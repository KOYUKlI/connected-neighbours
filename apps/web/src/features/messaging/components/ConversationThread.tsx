import { useState } from 'react';
import type { FormEvent } from 'react';

import type { ConversationItem, MessageItem } from '../../../api/messaging';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { IconButton } from '../../../components/ui/IconButton';
import { Input } from '../../../components/ui/Input';
import { LoadingState } from '../../../components/ui/LoadingState';
import { getConversationLabel } from '../conversationLabel';
import { ConversationAvatar } from './ConversationAvatar';
import { MessageBubble } from './MessageBubble';

const dayFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

function getDayLabel(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Aujourd’hui';
  if (isSameDay(date, yesterday)) return 'Hier';
  return dayFormatter.format(date);
}

function groupByDay(messages: MessageItem[]) {
  const groups: { label: string; items: MessageItem[] }[] = [];

  for (const message of messages) {
    const label = getDayLabel(message.createdAt);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(message);
    } else {
      groups.push({ label, items: [message] });
    }
  }

  return groups;
}

type ConversationThreadProps = {
  conversation: ConversationItem;
  messages: MessageItem[];
  currentUserId: string | null;
  isLoading: boolean;
  onBack: () => void;
  onToggleInfo: () => void;
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
  onToggleInfo,
  onSendText,
  isRecording,
  recordError,
  onStartRecording,
  onStopRecording,
}: ConversationThreadProps) {
  const [draft, setDraft] = useState('');

  const isPrivate = conversation.type === 'private';
  const otherParticipant = isPrivate
    ? conversation.participants.find((participant) => participant.id !== currentUserId)
    : undefined;
  const otherParticipantLastReadAt = otherParticipant
    ? conversation.lastReadAt[otherParticipant.id]
    : undefined;
  const lastOwnMessageId = isPrivate
    ? [...messages].reverse().find((message) => message.senderId === currentUserId)?.id
    : undefined;
  const label = getConversationLabel(conversation, currentUserId);
  const groups = groupByDay(messages);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    onSendText(draft.trim());
    setDraft('');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <IconButton className="lg:hidden" icon="arrow-left" label="Revenir aux conversations" onClick={onBack} />
        <ConversationAvatar name={label} seed={conversation.id} />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-extrabold text-slate-950">{label}</strong>
          {conversation.type === 'group' ? (
            <span className="block text-xs text-slate-500">
              {conversation.participants.length} participants
            </span>
          ) : null}
        </div>
        <IconButton icon="user" label="Afficher les informations" onClick={onToggleInfo} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
        {isLoading ? (
          <LoadingState message="Chargement des messages…" />
        ) : (
          groups.map((group) => (
            <div className="space-y-2" key={group.label}>
              <div className="sticky top-0 z-0 flex justify-center">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  {group.label}
                </span>
              </div>
              {group.items.map((message) => (
                <MessageBubble
                  isMine={message.senderId === currentUserId}
                  key={message.id}
                  message={message}
                  seen={
                    message.id === lastOwnMessageId &&
                    Boolean(otherParticipantLastReadAt) &&
                    new Date(otherParticipantLastReadAt as string) >= new Date(message.createdAt ?? 0)
                  }
                />
              ))}
            </div>
          ))
        )}
      </div>

      {recordError ? <ErrorMessage className="mx-4 mb-2" message={recordError} /> : null}

      <form className="flex items-center gap-2 border-t border-slate-200 px-4 py-3" onSubmit={handleSubmit}>
        <Input
          aria-label="Votre message"
          className="flex-1"
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Écrire à ${label}…`}
          type="text"
          value={draft}
        />
        <IconButton
          className={isRecording ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''}
          icon="mic"
          label={isRecording ? 'Arrêter l’enregistrement' : 'Message vocal'}
          onClick={isRecording ? onStopRecording : onStartRecording}
        />
        <Button disabled={!draft.trim()} type="submit" variant="primary">
          Envoyer
        </Button>
      </form>
    </div>
  );
}
