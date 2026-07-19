import { useNavigate } from 'react-router-dom';

import type { AdminIncidentRow } from '../../../api/admin';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useIncidentTable } from '../hooks/useIncidentTable';
import { IncidentRow } from './IncidentRow';

export function IncidentTable() {
  const { incidents, isLoading, error } = useIncidentTable();
  const navigate = useNavigate();

  function handleOpenAlerts(incident: AdminIncidentRow) {
    if (incident.id) {
      navigate(`/incidents/${incident.id}/alerts`);
    }
  }

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (incidents.length === 0) {
    return <EmptyState message="Aucun incident recent." />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Type</th>
            <th>Severite</th>
            <th>Statut</th>
            <th>Source</th>
            <th>External ID</th>
            <th>Derniere sync</th>
            <th>Creation</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <IncidentRow
              incident={incident}
              key={incident.id}
              onOpenAlerts={handleOpenAlerts}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
