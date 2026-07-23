import { useMemo, useState } from 'react';

import type { ConversationItem } from '../../../api/messaging';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { IconButton } from '../../../components/ui/IconButton';
import { Input } from '../../../components/ui/Input';
import { LoadingState } from '../../../components/ui/LoadingState';
import { Tabs, type TabItem } from '../../../components/ui/Tabs';
import { formatTime } from '../../../shared/utils/format';
import { getConversationLabel, isConversationUnread } from '../conversationLabel';
import { ConversationAvatar } from './ConversationAvatar';

type FilterId = 'all' | 'direct' | 'group' | 'unread';

const filters: TabItem<FilterId>[] = [
  { id: 'all', label: 'Tous' },
  { id: 'direct', label: 'Personnels' },
  { id: 'group', label: 'Groupes' },
  { id: 'unread', label: 'Non lus' },
];

function getPreview(conversation: ConversationItem) {
  const message = conversation.lastMessage;

  if (!message) {
    return 'Aucun message';
  }

  return message.type === 'vocal' ? 'Message vocal' : message.body;
}

type ConversationSidebarProps = {
  conversations: ConversationItem[];
  currentUserId: string | null;
  isLoading: boolean;
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onStartNew: () => void;
};

export function ConversationSidebar({
  conversations,
  currentUserId,
  isLoading,
  selectedConversationId,
  onSelect,
  onStartNew,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (filter === 'direct' && conversation.type !== 'private') return false;
      if (filter === 'group' && conversation.type !== 'group') return false;
      if (filter === 'unread' && !isConversationUnread(conversation, currentUserId)) return false;

      if (!query) return true;

      return getConversationLabel(conversation, currentUserId).toLowerCase().includes(query);
    });
  }, [conversations, currentUserId, filter, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-950">Conversations</h2>
          <p className="text-xs text-slate-500">
            {conversations.length} échange{conversations.length > 1 ? 's' : ''}
          </p>
        </div>
        <IconButton icon="plus" label="Nouveau message" onClick={onStartNew} />
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <Input
          aria-label="Rechercher une conversation"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une conversation"
          type="search"
          value={search}
        />
      </div>

      <Tabs className="px-2" items={filters} label="Filtrer les conversations" onChange={setFilter} value={filter} />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <LoadingState message="Chargement des conversations…" />
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              action={
                <Button onClick={onStartNew} variant="primary">
                  Nouvelle discussion
                </Button>
              }
              icon="message"
              message="Modifiez votre recherche ou démarrez une nouvelle discussion."
              title="Aucune conversation"
            />
          </div>
        ) : (
          <ul>
            {visibleConversations.map((conversation) => {
              const unread = isConversationUnread(conversation, currentUserId);
              const isActive = conversation.id === selectedConversationId;
              const label = getConversationLabel(conversation, currentUserId);

              return (
                <li key={conversation.id}>
                  <button
                    className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-emerald-700 bg-emerald-50'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                    onClick={() => onSelect(conversation.id)}
                    type="button"
                  >
                    <ConversationAvatar name={label} seed={conversation.id} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <strong className="truncate text-sm text-slate-950">{label}</strong>
                        {conversation.lastMessage ? (
                          <time className="shrink-0 text-xs text-slate-400">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </time>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {conversation.type === 'group' ? 'Groupe · ' : ''}
                        {getPreview(conversation)}
                      </span>
                    </span>
                    {unread ? <span className="size-2.5 shrink-0 rounded-full bg-emerald-600" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
