import { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { getIncident } from '../../../api/incidents';
import type { IncidentItem } from '../../../api/incidents';
import { getIncidentAlerts } from '../../../api/alerts';
import type { AlertItem } from '../../../api/alerts';
import { useResource } from '../../../shared/hooks/useResource';

type IncidentAlertsData = {
  incident: IncidentItem | null;
  alerts: AlertItem[];
};

const initialValue: IncidentAlertsData = { incident: null, alerts: [] };

export function useIncidentAlerts() {
  const { incidentId } = useParams<{ incidentId: string }>();

  const fetcher = useCallback(async (): Promise<IncidentAlertsData> => {
    if (!incidentId) {
      return initialValue;
    }

    const [incident, alerts] = await Promise.all([
      getIncident(incidentId),
      getIncidentAlerts(incidentId),
    ]);

    return { incident, alerts };
  }, [incidentId]);

  const { data, isLoading, error } = useResource(fetcher, initialValue);

  return {
    incidentId,
    incident: data.incident,
    alerts: data.alerts,
    isLoading,
    error,
  };
}
