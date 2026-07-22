import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  closeIncident,
  createIncidentAlert,
  fetchIncident,
  fetchIncidentAlerts,
  resolveAlert,
  resolveIncident,
  updateAlert,
  type AdminAlertRow,
  type AdminIncidentRow,
  type AlertSeverityInput,
} from '../../../api/admin';
import { ApiError } from '../../../api/client';
import type { SeverityDistributionEntry } from '../../alerts/components/AlertGraph';

export function useIncidentDetailPanel(incidentId: string, onChanged: () => void) {
  const [incident, setIncident] = useState<AdminIncidentRow | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [alertModal, setAlertModal] = useState<'create' | AdminAlertRow | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextIncident, nextAlerts] = await Promise.all([
        fetchIncident(incidentId),
        fetchIncidentAlerts(incidentId),
      ]);
      setIncident(nextIncident);
      setAlerts(nextAlerts);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const severityDistribution = useMemo<SeverityDistributionEntry[]>(() => {
    if (alerts.length === 0) return [];

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

  async function runAction(key: string, action: () => Promise<AdminIncidentRow>) {
    setPending(key);
    setError(null);
    try {
      setIncident(await action());
      onChanged();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  function handleResolveIncident() {
    return runAction('resolve', () => resolveIncident(incidentId));
  }

  function handleCloseIncident() {
    return runAction('close', () => closeIncident(incidentId));
  }

  function handleIncidentSaved(updated: AdminIncidentRow) {
    setIncident(updated);
    setEditOpen(false);
    onChanged();
  }

  async function handleCreateAlert(input: { title: string; details: string; severity: AlertSeverityInput }) {
    setPending('alert-save');
    setError(null);
    try {
      await createIncidentAlert(incidentId, input);
      await load();
      setAlertModal(null);
      onChanged();
      return true;
    } catch (caught) {
      setError(getErrorMessage(caught));
      return false;
    } finally {
      setPending(null);
    }
  }

  async function handleUpdateAlert(
    alertId: string,
    input: { title: string; details: string; severity: AlertSeverityInput },
  ) {
    setPending('alert-save');
    setError(null);
    try {
      await updateAlert(alertId, input);
      await load();
      setAlertModal(null);
      onChanged();
      return true;
    } catch (caught) {
      setError(getErrorMessage(caught));
      return false;
    } finally {
      setPending(null);
    }
  }

  async function handleResolveAlert(alert: AdminAlertRow) {
    if (!alert.id) return;
    setPending(`alert-resolve-${alert.id}`);
    setError(null);
    try {
      await resolveAlert(alert.id);
      await load();
      onChanged();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  function submitAlertModal(input: { title: string; details: string; severity: AlertSeverityInput }) {
    return alertModal && alertModal !== 'create'
      ? handleUpdateAlert(alertModal.id ?? '', input)
      : handleCreateAlert(input);
  }

  return {
    incident,
    alerts,
    loading,
    pending,
    error,
    severityDistribution,
    editOpen,
    openEdit: () => setEditOpen(true),
    closeEdit: () => setEditOpen(false),
    handleIncidentSaved,
    alertModal,
    openCreateAlert: () => setAlertModal('create'),
    openEditAlert: setAlertModal,
    closeAlertModal: () => setAlertModal(null),
    submitAlertModal,
    handleResolveIncident,
    handleCloseIncident,
    handleResolveAlert,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return 'Une erreur inattendue est survenue.';
}
