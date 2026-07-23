import type { ConversationItem, MessageItem } from '../../../api/messaging';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getConversationLabel } from '../conversationLabel';
import { ConversationAvatar } from './ConversationAvatar';

export function ConversationInfoPanel({
  conversation,
  currentUserId,
  messages,
}: {
  conversation: ConversationItem;
  currentUserId: string | null;
  messages: MessageItem[];
}) {
  const label = getConversationLabel(conversation, currentUserId);
  const otherParticipants = conversation.participants.filter((p) => p.id !== currentUserId);
  const sharedAttachments = messages.flatMap((message) =>
    message.attachments.map((attachment) => ({ message, attachment })),
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div className="flex flex-col items-center text-center">
        <ConversationAvatar name={label} seed={conversation.id} size="lg" />
        <h2 className="mt-3 text-lg font-extrabold text-slate-950">{label}</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {conversation.type === 'group' ? 'Conversation de groupe' : 'Conversation personnelle'}
        </p>
      </div>

      {conversation.type === 'group' ? (
        <section>
          <h3 className="mb-2 text-sm font-extrabold text-slate-900">
            Participants ({otherParticipants.length})
          </h3>
          <ul className="space-y-2">
            {otherParticipants.map((participant) => (
              <li className="flex items-center gap-3" key={participant.id}>
                <ConversationAvatar name={participant.displayName ?? participant.email} seed={participant.id} />
                <span className="truncate text-sm font-semibold text-slate-800">
                  {participant.displayName ?? participant.email}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-slate-900">Fichiers partagés</h3>
        {sharedAttachments.length === 0 ? (
          <EmptyState icon="message" message="Aucun fichier partagé pour le moment." />
        ) : (
          <ul className="space-y-2">
            {sharedAttachments.map(({ message, attachment }) => (
              <li key={`${message.id}-${attachment.objectKey}`}>
                <a
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-emerald-300 hover:bg-emerald-50"
                  href={attachment.downloadUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-600">
                    {attachment.mimeType.split('/')[0]?.toUpperCase().slice(0, 3)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                    {attachment.fileName}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
