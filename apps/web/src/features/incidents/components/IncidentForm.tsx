import { useState } from 'react';
import type { FormEvent } from 'react';

import type { AuthUser } from '../../../api/auth';
import type {
  CreateIncidentInput,
  IncidentSeverity,
  IncidentType,
} from '../../../api/incidents';

type IncidentFormProps = {
  currentUser: AuthUser | null;
  isPending: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<boolean>;
};

export function IncidentForm({ currentUser, isPending, onCreate }: IncidentFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IncidentType>('security');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [neighborhoodId, setNeighborhoodId] = useState(
    currentUser?.neighborhoodId ?? 'quartier-centre',
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onCreate({ title, description, type, severity, neighborhoodId });

    if (success) {
      setTitle('');
      setDescription('');
    }
  }

  return (
    <section className="panel">
      <h2>Signaler un incident</h2>
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
              onChange={(event) => setType(event.target.value as IncidentType)}
              value={type}
            >
              <option value="security">Securite</option>
              <option value="maintenance">Maintenance</option>
              <option value="nuisance">Nuisance</option>
              <option value="cleanliness">Proprete</option>
              <option value="traffic">Circulation</option>
              <option value="other">Autre</option>
            </select>
          </label>
          <label>
            Severite
            <select
              onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
              value={severity}
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="critical">Critique</option>
            </select>
          </label>
        </div>
        <label>
          Quartier
          <input
            onChange={(event) => setNeighborhoodId(event.target.value)}
            required
            value={neighborhoodId}
          />
        </label>
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? 'Signalement...' : 'Signaler'}
        </button>
      </form>
    </section>
  );
}
