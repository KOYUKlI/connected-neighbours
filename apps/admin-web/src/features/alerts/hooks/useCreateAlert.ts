import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createIncidentAlert } from '../../../api/admin';
import type { CreateAlertInput } from '../../../api/admin';
import { useAdminAuth } from '../../../auth/useAdminAuth';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useCreateAlert() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { handleSessionError } = useAdminAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: CreateAlertInput) {
    if (!incidentId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createIncidentAlert(incidentId, input);
      navigate(`/incidents/${incidentId}/alerts`);
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
      navigate(`/incidents/${incidentId}/alerts`);
    }
  }

  return { incidentId, isSubmitting, error, submit, cancel };
}
