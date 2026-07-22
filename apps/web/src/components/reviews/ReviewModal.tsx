import { useState } from 'react';

import { createReview, type ReviewItem } from '../../api/reviews';
import { getFriendlyError } from '../../utils/errors';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';

export function ReviewModal({
  contractId,
  onClose,
  onCreated,
  open,
  serviceTitle,
  targetName,
}: {
  contractId: string;
  onClose: () => void;
  onCreated: (review: ReviewItem) => void;
  open: boolean;
  serviceTitle: string;
  targetName: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const review = await createReview(contractId, { rating, comment });
      onCreated(review);
      setRating(5);
      setComment('');
      onClose();
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de publier cet avis.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      description={`Votre avis sur ${targetName} pour « ${serviceTitle} » sera visible selon vos paramètres de profil.`}
      onClose={onClose}
      open={open}
      title="Déposer un avis"
    >
      <div className="grid gap-5">
        {error ? <ErrorMessage message={error} /> : null}
        <fieldset>
          <legend className="text-sm font-bold text-slate-900">Votre note</legend>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                className={`grid min-h-11 cursor-pointer place-items-center rounded-lg border text-sm font-bold transition focus-within:ring-4 focus-within:ring-emerald-200 ${
                  rating === value
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                key={value}
              >
                <input
                  checked={rating === value}
                  className="sr-only"
                  name="rating"
                  onChange={() => setRating(value)}
                  type="radio"
                  value={value}
                />
                {value}/5
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Commentaire facultatif
          <Textarea
            maxLength={1000}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Décrivez votre expérience avec des mots simples et respectueux."
            rows={5}
            value={comment}
          />
          <span className="text-right text-xs font-normal text-slate-500">{comment.length}/1000</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose}>Annuler</Button>
          <Button disabled={pending} onClick={() => void submit()} variant="primary">
            {pending ? 'Publication…' : 'Publier mon avis'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
