import { fetchDashboard } from '../../api/admin';
import { EmptyState } from '../../shared/components/EmptyState';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { formatDate, formatNumber } from '../../shared/utils/format';
import { MetricCard } from '../../shared/components/MetricCard';

export function DashboardPage() {
  const { data: dashboard, isLoading, error } = useAdminResource(fetchDashboard, null);

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!dashboard) {
    return <EmptyState message="Aucune donnee dashboard chargee." />;
  }

  const metrics = [
    {
      label: 'Services',
      value: dashboard.totalServices,
      detail: `${formatNumber(dashboard.publishedServices)} publies, ${formatNumber(
        dashboard.completedServices,
      )} termines`,
    },
    {
      label: 'Candidatures',
      value: dashboard.totalApplications,
      detail: 'Dossiers de service recus',
    },
    {
      label: 'Contrats',
      value: dashboard.totalContracts,
      detail: `${formatNumber(dashboard.activeContracts)} actifs, ${formatNumber(
        dashboard.completedContracts,
      )} termines`,
    },
    {
      label: 'Incidents',
      value: dashboard.totalIncidents,
      detail: `${formatNumber(dashboard.openIncidents)} ouverts, ${formatNumber(
        dashboard.resolvedIncidents,
      )} resolus`,
    },
    {
      label: 'Alertes',
      value: dashboard.totalAlerts,
      detail: `${formatNumber(dashboard.openAlerts)} ouvertes`,
    },
    {
      label: 'Clients sync',
      value: dashboard.knownSyncClients,
      detail: 'Postes JavaFX connus',
    },
  ];

  return (
    <>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="server-time">
        <span>Heure serveur</span>
        <strong>{formatDate(dashboard.serverTime)}</strong>
      </div>
    </>
  );
}
