import { useState } from 'react';

import { createIncident, getIncidents } from '../../../api/incidents';
import type { CreateIncidentInput } from '../../../api/incidents';
import { useAuth } from '../../../auth/useAuth';
import { useResource } from '../../../shared/hooks/useResource';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useIncidentsPage() {
  const { handleSessionError } = useAuth();
  const { data: incidents, isLoading, error: loadError, reload } = useResource(
    getIncidents,
    [],
  );
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onCreateIncident(input: CreateIncidentInput) {
    setActionPending('create-incident');
    setActionError(null);

    try {
      await createIncident(input);
      reload();
      return true;
    } catch (error) {
      if (handleSessionError(error)) {
        return false;
      }

      setActionError(getErrorMessage(error));
      return false;
    } finally {
      setActionPending(null);
    }
  }

  return {
    incidents,
    isLoading,
    error: actionError ?? loadError,
    actionPending,
    onCreateIncident,
  };
}
