import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchIncident, fetchIncidentAlerts } from '../../../api/admin';
import type { AdminAlertRow, AdminIncidentRow } from '../../../api/admin';
import { useAdminAuth } from '../../../auth/useAdminAuth';
import { getErrorMessage } from '../../../shared/utils/errors';

export type SeverityDistributionEntry = {
  severity: string;
  count: number;
  percentage: number;
};

export function useIncidentAlerts() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const { handleSessionError } = useAdminAuth();

  const [incident, setIncident] = useState<AdminIncidentRow | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) {
      return;
    }

    let ignore = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [nextIncident, nextAlerts] = await Promise.all([
          fetchIncident(incidentId!),
          fetchIncidentAlerts(incidentId!),
        ]);

        if (!ignore) {
          setIncident(nextIncident);
          setAlerts(nextAlerts);
        }
      } catch (err) {
        if (handleSessionError(err)) {
          return;
        }

        if (!ignore) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [incidentId, handleSessionError]);

  const severityDistribution = useMemo<SeverityDistributionEntry[]>(() => {
    if (alerts.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const alert of alerts) {
      const severity = alert.severity ?? 'unknown';
      counts.set(severity, (counts.get(severity) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([severity, count]) => ({
      severity,
      count,
      percentage: Math.round((count / alerts.length) * 100),
    }));
  }, [alerts]);

  return { incident, alerts, severityDistribution, isLoading, error };
}
