import { useCallback, useEffect, useState } from 'react';

import {
  closeIncident,
  fetchIncidents,
  resolveIncident,
  type AdminIncidentRow,
} from '../../../api/admin';
import { ApiError } from '../../../api/client';
import { fetchNeighborhoods, type NeighborhoodItem } from '../../../api/neighborhoods';

export function useIncidentsPage() {
  const [incidents, setIncidents] = useState<AdminIncidentRow[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextIncidents, nextNeighborhoods] = await Promise.all([
        fetchIncidents(),
        fetchNeighborhoods(),
      ]);
      setIncidents(nextIncidents);
      setNeighborhoods(nextNeighborhoods);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleResolve(incident: AdminIncidentRow) {
    if (!incident.id) return;
    setError(null);
    try {
      await resolveIncident(incident.id);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  async function handleClose(incident: AdminIncidentRow) {
    if (!incident.id) return;
    setError(null);
    try {
      await closeIncident(incident.id);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return {
    incidents,
    neighborhoods,
    selectedId,
    loading,
    error,
    reload: load,
    openIncident: setSelectedId,
    closeDetail: () => setSelectedId(null),
    handleResolve,
    handleClose,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return 'Impossible de charger les incidents.';
}
