import { Link } from 'react-router-dom';

import { EmptyState } from '../../shared/components/EmptyState';
import { MetricCard } from '../../shared/components/MetricCard';
import { AlertGraph } from './components/AlertGraph';
import { AlertWidget } from './components/AlertWidget';
import { useIncidentAlerts } from './hooks/useIncidentAlerts';

export function IncidentAlertsPage() {
  const { incident, alerts, severityDistribution, isLoading, error } = useIncidentAlerts();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!incident) {
    return <EmptyState message="Incident introuvable." />;
  }

  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;

  return (
    <div className="incident-alerts-page">
      <div className="incident-alerts-header">
        <Link className="secondary-button" to="/incidents">
          Retour aux incidents
        </Link>
        <h2>
          Incident #{incident.id} - {incident.title}
        </h2>
        <Link
          className="primary-button create-alert-link"
          to={`/incidents/${incident.id}/alerts/new`}
        >
          Creer une alerte
        </Link>
      </div>

      <div className="metrics-grid">
        <MetricCard detail="Total sur cet incident" label="Alertes" value={alerts.length} />
        <MetricCard
          detail="Severite critique"
          label="Alertes critiques"
          value={criticalCount}
        />
      </div>

      <AlertGraph distribution={severityDistribution} />

      <div className="alert-widget-list">
        {alerts.length === 0 ? (
          <EmptyState message="Aucune alerte pour cet incident." />
        ) : (
          alerts.map((alert) => <AlertWidget alert={alert} key={alert.id} />)
        )}
      </div>
    </div>
  );
}
