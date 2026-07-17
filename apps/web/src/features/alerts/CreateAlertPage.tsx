import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { AlertSeverity } from '../../api/alerts';
import { useCreateAlert } from './hooks/useCreateAlert';

const severityOptions: { value: AlertSeverity; label: string }[] = [
  { value: 'low', label: 'Mineure' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
];

export function CreateAlertPage() {
  const { incidentId, isSubmitting, error, submit, cancel } = useCreateAlert();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('medium');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit({ title, details, severity });
  }

  return (
    <div className="create-alert-page">
      <div className="incident-alerts-header">
        <Link className="secondary-button" to={`/incidents/${incidentId ?? ''}/alerts`}>
          Retour aux alertes
        </Link>
        <h2>Nouvelle alerte</h2>
      </div>

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
          Details
          <textarea
            onChange={(event) => setDetails(event.target.value)}
            required
            rows={4}
            value={details}
          />
        </label>

        <label>
          Severite
          <select
            onChange={(event) => setSeverity(event.target.value as AlertSeverity)}
            value={severity}
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error ? <div className="error-banner compact">{error}</div> : null}

        <div className="form-actions">
          <button className="ghost-button" onClick={cancel} type="button">
            Annuler
          </button>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signalement...' : "Signaler l'alerte"}
          </button>
        </div>
      </form>
    </div>
  );
}
