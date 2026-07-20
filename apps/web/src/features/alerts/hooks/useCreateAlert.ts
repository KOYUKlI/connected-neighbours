import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createAlert } from '../../../api/alerts';
import type { CreateAlertInput } from '../../../api/alerts';
import { useAuth } from '../../../auth/useAuth';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useCreateAlert() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { handleSessionError } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: CreateAlertInput) {
    if (!incidentId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAlert(incidentId, input);
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

  return { incidentId, isSubmitting, error, submit, cancel };
}
