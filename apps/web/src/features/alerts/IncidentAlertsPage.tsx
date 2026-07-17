import { Link } from 'react-router-dom';

import { EmptyState } from '../../shared/components/EmptyState';
import { getEntityId } from '../../shared/utils/entities';
import { AlertCard } from './components/AlertCard';
import { useIncidentAlerts } from './hooks/useIncidentAlerts';

export function IncidentAlertsPage() {
  const { incidentId, incident, alerts, isLoading, error } = useIncidentAlerts();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!incident) {
    return <EmptyState message="Incident introuvable." />;
  }

  return (
    <div className="incident-alerts-page">
      <div className="incident-alerts-header">
        <Link className="secondary-button" to="/incidents">
          Retour aux incidents
        </Link>
        <h2>Alertes - {incident.title}</h2>
        <Link
          className="primary-button create-alert-link"
          to={`/incidents/${incidentId}/alerts/new`}
        >
          Signaler une alerte
        </Link>
      </div>

      {alerts.length === 0 ? (
        <EmptyState message="Aucune alerte pour cet incident." />
      ) : (
        <div className="stack">
          {alerts.map((alert) => (
            <AlertCard alert={alert} key={getEntityId(alert)} />
          ))}
        </div>
      )}
    </div>
  );
}
