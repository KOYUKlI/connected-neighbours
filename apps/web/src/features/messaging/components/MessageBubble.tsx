import type { MessageItem } from '../../../api/messaging';
import { formatTime } from '../../../shared/utils/format';

type MessageBubbleProps = {
  message: MessageItem;
  isMine: boolean;
};

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const attachment = message.attachments[0];

  return (
    <div className={isMine ? 'chat-bubble chat-bubble-mine' : 'chat-bubble'}>
      {message.type === 'vocal' && attachment ? (
        <audio controls src={attachment.downloadUrl} />
      ) : (
        <p>{message.body}</p>
      )}
      <span className="chat-bubble-time">{formatTime(message.createdAt)}</span>
    </div>
  );
}
