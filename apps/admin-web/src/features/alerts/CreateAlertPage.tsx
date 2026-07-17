import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { AlertSeverityInput } from '../../api/admin';
import { useCreateAlert } from './hooks/useCreateAlert';

const severityOptions: { value: AlertSeverityInput; label: string }[] = [
  { value: 'low', label: 'Mineure' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
];

export function CreateAlertPage() {
  const { incidentId, isSubmitting, error, submit, cancel } = useCreateAlert();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<AlertSeverityInput | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [severityError, setSeverityError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitleError = title.trim() ? null : "Le titre de l'alerte est obligatoire";
    const nextDetailsError = details.trim()
      ? null
      : "La description de l'alerte est obligatoire";
    const nextSeverityError = severity ? null : 'Veuillez selectionner une gravite';

    setTitleError(nextTitleError);
    setDetailsError(nextDetailsError);
    setSeverityError(nextSeverityError);

    if (nextTitleError || nextDetailsError || nextSeverityError || !severity) {
      return;
    }

    void submit({ title: title.trim(), details: details.trim(), severity });
  }

  return (
    <div className="create-alert-page">
      <div className="incident-alerts-header">
        <Link className="secondary-button" to={`/incidents/${incidentId ?? ''}/alerts`}>
          Retour aux alertes
        </Link>
        <h2>Nouvelle alerte</h2>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Titre
          <input
            onChange={(event) => setTitle(event.target.value)}
            type="text"
            value={title}
          />
        </label>
        {titleError ? <div className="error-banner compact">{titleError}</div> : null}

        <label>
          Description
          <textarea
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            value={details}
          />
        </label>
        {detailsError ? <div className="error-banner compact">{detailsError}</div> : null}

        <div className="severity-toggle-group">
          {severityOptions.map((option) => (
            <button
              className={
                severity === option.value
                  ? `severity-toggle active severity-${option.value}`
                  : 'severity-toggle'
              }
              key={option.value}
              onClick={() => setSeverity(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        {severityError ? <div className="error-banner compact">{severityError}</div> : null}

        {error ? <div className="error-banner compact">{error}</div> : null}

        <div className="form-actions">
          <button className="ghost-button" onClick={cancel} type="button">
            Annuler
          </button>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creation...' : "Creer l'alerte"}
          </button>
        </div>
      </form>
    </div>
  );
}
