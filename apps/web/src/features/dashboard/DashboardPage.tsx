import { useAuth } from '../../auth/useAuth';
import { EmptyState } from '../../shared/components/EmptyState';
import { MetricCard } from '../../shared/components/MetricCard';
import { formatNumber } from '../../shared/utils/format';
import { useDashboardData } from './hooks/useDashboardData';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const { services, myApplications, contracts, pointBalance, incidents } = data;

  if (services.length === 0 && contracts.length === 0 && incidents.length === 0) {
    return <EmptyState message="Aucune donnee dashboard chargee." />;
  }

  const ownServices = services.filter(
    (service) => service.ownerId === currentUser?.id,
  );
  const publishedServices = services.filter(
    (service) => service.status === 'published',
  );
  const activeContracts = contracts.filter(
    (contract) => contract.status === 'active',
  );
  const completedContracts = contracts.filter(
    (contract) => contract.status === 'completed',
  );
  const openIncidents = incidents.filter((incident) =>
    ['reported', 'open', 'in_progress'].includes(incident.status),
  );

  const metrics = [
    {
      label: 'Services visibles',
      value: services.length,
      detail: `${formatNumber(publishedServices.length)} publies`,
    },
    {
      label: 'Mes services',
      value: ownServices.length,
      detail: 'Annonces que je pilote',
    },
    {
      label: 'Mes candidatures',
      value: myApplications.length,
      detail: 'Reponses envoyees',
    },
    {
      label: 'Contrats',
      value: contracts.length,
      detail: `${formatNumber(activeContracts.length)} actifs, ${formatNumber(
        completedContracts.length,
      )} termines`,
    },
    {
      label: 'Points disponibles',
      value: pointBalance?.availablePoints ?? 0,
      detail: `${formatNumber(pointBalance?.reservedPoints ?? 0)} reserves`,
    },
    {
      label: 'Incidents ouverts',
      value: openIncidents.length,
      detail: `${formatNumber(incidents.length)} incidents visibles`,
    },
  ];

  return (
    <div className="dashboard-grid">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
