import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createIncident, getIncidents } from '../../../api/incidents';
import type { CreateIncidentInput, IncidentItem } from '../../../api/incidents';
import { useAuth } from '../../../auth/useAuth';
import { useResource } from '../../../shared/hooks/useResource';
import { getEntityId } from '../../../shared/utils/entities';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useIncidentsPage() {
  const { currentUser, handleSessionError } = useAuth();
  const navigate = useNavigate();
  const { data: incidents, isLoading, error: loadError, reload } = useResource(
    getIncidents,
    [],
  );
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const myIncidents = incidents.filter(
    (incident) => incident.reportedById === currentUser?.id,
  );
  const otherIncidents = incidents.filter(
    (incident) =>
      incident.reportedById !== currentUser?.id &&
      incident.neighborhoodId === currentUser?.neighborhoodId,
  );

  function handleOpenAlerts(incident: IncidentItem) {
    const incidentId = getEntityId(incident);

    if (incidentId) {
      navigate(`/app/incidents/${incidentId}/alerts`);
    }
  }

  async function handleCreate(input: CreateIncidentInput) {
    setActionPending('create-incident');
    setActionError(null);

    try {
      await createIncident(input);
      reload();
      setIsCreating(false);
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
    currentUser,
    myIncidents,
    otherIncidents,
    isLoading,
    error: actionError ?? loadError,
    actionPending,
    isCreating,
    startCreating: () => setIsCreating(true),
    cancelCreating: () => setIsCreating(false),
    handleCreate,
    handleOpenAlerts,
  };
}
