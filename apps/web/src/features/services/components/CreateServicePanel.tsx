import { useState } from 'react';
import type { FormEvent } from 'react';

import type { AuthUser } from '../../../api/auth';
import type { CreateServiceInput, ServiceStatus, ServiceType } from '../../../api/services';

type CreateServicePanelProps = {
  currentUser: AuthUser | null;
  isPending: boolean;
  onCreate: (input: CreateServiceInput) => Promise<boolean>;
};

export function CreateServicePanel({
  currentUser,
  isPending,
  onCreate,
}: CreateServicePanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ServiceType>('request');
  const [category, setCategory] = useState('bricolage');
  const [availability, setAvailability] = useState('Cette semaine');
  const [neighborhoodId, setNeighborhoodId] = useState(
    currentUser?.neighborhoodId ?? 'quartier-centre',
  );
  const [isPaid, setIsPaid] = useState(true);
  const [pricePoints, setPricePoints] = useState(10);
  const [status, setStatus] = useState<ServiceStatus>('draft');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onCreate({
      title,
      description,
      type,
      category,
      availability,
      neighborhoodId,
      isPaid,
      pricePoints: isPaid ? pricePoints : undefined,
      status,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setStatus('draft');
    }
  }

  return (
    <section className="panel">
      <h2>Creer un service</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Titre
          <input
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </label>

        <label>
          Description
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            value={description}
          />
        </label>

        <div className="form-row">
          <label>
            Type
            <select
              onChange={(event) => setType(event.target.value as ServiceType)}
              value={type}
            >
              <option value="request">Demande</option>
              <option value="offer">Offre</option>
            </select>
          </label>

          <label>
            Statut initial
            <select
              onChange={(event) => setStatus(event.target.value as ServiceStatus)}
              value={status}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publie</option>
            </select>
          </label>
        </div>

        <label>
          Categorie
          <input
            onChange={(event) => setCategory(event.target.value)}
            required
            value={category}
          />
        </label>

        <label>
          Disponibilite
          <input
            onChange={(event) => setAvailability(event.target.value)}
            required
            value={availability}
          />
        </label>

        <label>
          Quartier
          <input
            onChange={(event) => setNeighborhoodId(event.target.value)}
            required
            value={neighborhoodId}
          />
        </label>

        <label className="checkbox-line">
          <input
            checked={isPaid}
            onChange={(event) => setIsPaid(event.target.checked)}
            type="checkbox"
          />
          Service remunere en points
        </label>

        {isPaid ? (
          <label>
            Prix en points
            <input
              min={1}
              onChange={(event) => setPricePoints(Number(event.target.value))}
              required
              type="number"
              value={pricePoints}
            />
          </label>
        ) : null}

        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? 'Creation...' : 'Creer le service'}
        </button>
      </form>
    </section>
  );
}
