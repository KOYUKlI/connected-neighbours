import { useState } from 'react';
import { Link } from 'react-router-dom';

import { replyToReview, type ReviewItem } from '../../api/reviews';
import { formatDate } from '../../utils/format';
import { getFriendlyError } from '../../utils/errors';
import { Avatar } from '../profiles/Avatar';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Textarea } from '../ui/Textarea';

export function ReviewCard({
  onUpdated,
  review,
}: {
  onUpdated?: (review: ReviewItem) => void;
  review: ReviewItem;
}) {
  const [replying, setReplying] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReply() {
    if (!message.trim()) return;
    setPending(true);
    setError(null);
    try {
      const updated = await replyToReview(review.id, message.trim());
      setReplying(false);
      setMessage('');
      onUpdated?.(updated);
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de publier cette réponse.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar
          className="size-10"
          name={review.author?.displayName ?? 'Habitant'}
          url={review.author?.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {review.author ? (
              <Link
                className="font-bold text-slate-950 hover:text-emerald-800"
                to={`/neighbors/${review.author.id}`}
              >
                {review.author.displayName}
              </Link>
            ) : (
              <strong>Habitant</strong>
            )}
            <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
          </div>
          <p aria-label={`Note : ${review.rating} sur 5`} className="mt-1 font-bold text-amber-600">
            {review.rating}/5
          </p>
          {review.comment ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>
          ) : (
            <p className="mt-2 text-sm italic text-slate-500">Avis sans commentaire.</p>
          )}
          {review.status === 'hidden' ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              Cet avis est masqué. {review.moderationReason}
            </p>
          ) : null}
          {review.response ? (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Réponse</p>
              <p className="mt-1 text-sm text-slate-700">{review.response.message}</p>
            </div>
          ) : null}
          {review.permissions.canReply && !replying ? (
            <Button className="mt-3" onClick={() => setReplying(true)} size="sm">
              Répondre
            </Button>
          ) : null}
          {replying ? (
            <div className="mt-3 grid gap-3">
              {error ? <ErrorMessage message={error} /> : null}
              <Textarea
                aria-label="Réponse à l’avis"
                maxLength={1000}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                value={message}
              />
              <div className="flex justify-end gap-2">
                <Button disabled={pending} onClick={() => setReplying(false)} size="sm">
                  Annuler
                </Button>
                <Button
                  disabled={pending || !message.trim()}
                  onClick={() => void submitReply()}
                  size="sm"
                  variant="primary"
                >
                  {pending ? 'Publication…' : 'Publier la réponse'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
