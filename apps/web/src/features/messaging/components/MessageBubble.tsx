import type { MessageItem } from '../../../api/messaging';
import { formatTime } from '../../../shared/utils/format';

type MessageBubbleProps = {
  message: MessageItem;
  isMine: boolean;
  seen?: boolean;
};

export function MessageBubble({ message, isMine, seen }: MessageBubbleProps) {
  const attachment = message.attachments[0];

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isMine ? 'bg-emerald-100 text-emerald-950' : 'bg-white text-slate-900 shadow-sm'
        }`}
      >
        {message.type === 'vocal' && attachment ? (
          <audio className="h-8 max-w-56" controls src={attachment.downloadUrl} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
        )}
        <span className="mt-1 block text-right text-[11px] text-slate-500">
          {formatTime(message.createdAt)}
          {isMine && seen ? <span className="font-semibold text-emerald-700"> · Vu</span> : null}
        </span>
      </div>
    </div>
  );
}
