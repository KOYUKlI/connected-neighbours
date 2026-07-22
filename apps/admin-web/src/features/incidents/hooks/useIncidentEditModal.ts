import { useState, type FormEvent } from 'react';

import {
  updateIncident,
  type AdminIncidentRow,
  type AlertSeverityInput,
  type IncidentTypeInput,
} from '../../../api/admin';
import { ApiError } from '../../../api/client';

export function useIncidentEditModal(
  incident: AdminIncidentRow,
  onSaved: (incident: AdminIncidentRow) => void,
) {
  const [title, setTitle] = useState(incident.title ?? '');
  const [description, setDescription] = useState(incident.description ?? '');
  const [type, setType] = useState<IncidentTypeInput>((incident.type as IncidentTypeInput) ?? 'other');
  const [severity, setSeverity] = useState<AlertSeverityInput>(
    (incident.severity as AlertSeverityInput) ?? 'medium',
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const updated = await updateIncident(incident.id ?? '', {
        title: title.trim(),
        description: description.trim(),
        type,
        severity,
      });
      onSaved(updated);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    severity,
    setSeverity,
    pending,
    error,
    handleSubmit,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return 'Une erreur inattendue est survenue.';
}
