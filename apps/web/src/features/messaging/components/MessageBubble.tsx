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
    <div className={isMine ? 'chat-bubble chat-bubble-mine' : 'chat-bubble'}>
      {message.type === 'vocal' && attachment ? (
        <audio controls src={attachment.downloadUrl} />
      ) : (
        <p>{message.body}</p>
      )}
      <span className="chat-bubble-time">
        {formatTime(message.createdAt)}
        {isMine && seen ? <span className="chat-bubble-seen"> · Vu</span> : null}
      </span>
    </div>
  );
}
