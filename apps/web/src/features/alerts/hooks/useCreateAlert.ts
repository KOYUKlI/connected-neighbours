import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createAlert } from '../../../api/alerts';
import type { AlertSeverity } from '../../../api/alerts';
import { useAuth } from '../../../auth/useAuth';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useCreateAlert() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { handleSessionError } = useAuth();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!incidentId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAlert(incidentId, { title, details, severity });
      navigate(`/app/incidents/${incidentId}/alerts`);
    } catch (err) {
      if (handleSessionError(err)) {
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancel() {
    if (incidentId) {
      navigate(`/app/incidents/${incidentId}/alerts`);
    }
  }

  return {
    incidentId,
    title,
    setTitle,
    details,
    setDetails,
    severity,
    setSeverity,
    isSubmitting,
    error,
    handleSubmit,
    cancel,
  };
}
