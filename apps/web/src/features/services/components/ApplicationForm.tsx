import { useState } from 'react';
import type { FormEvent } from 'react';

import type { CreateApplicationInput } from '../../../api/applications';

type ApplicationFormProps = {
  defaultPrice?: number;
  isPending: boolean;
  onApply: (input: CreateApplicationInput) => Promise<boolean>;
};

export function ApplicationForm({ defaultPrice, isPending, onApply }: ApplicationFormProps) {
  const [message, setMessage] = useState('');
  const [proposedPricePoints, setProposedPricePoints] = useState(defaultPrice ?? 0);
  const [proposedDate, setProposedDate] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input: CreateApplicationInput = {
      message,
      proposedDate: proposedDate || undefined,
      proposedPricePoints: proposedPricePoints > 0 ? proposedPricePoints : undefined,
    };
    const success = await onApply(input);

    if (success) {
      setMessage('');
      setProposedDate('');
    }
  }

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      <label>
        Message de candidature
        <textarea
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={3}
          value={message}
        />
      </label>
      <div className="form-row">
        <label>
          Date proposee
          <input
            onChange={(event) => setProposedDate(event.target.value)}
            type="datetime-local"
            value={proposedDate}
          />
        </label>
        <label>
          Points proposes
          <input
            min={0}
            onChange={(event) => setProposedPricePoints(Number(event.target.value))}
            type="number"
            value={proposedPricePoints}
          />
        </label>
      </div>
      <button className="secondary-button" disabled={isPending} type="submit">
        {isPending ? 'Envoi...' : 'Candidater'}
      </button>
    </form>
  );
}
