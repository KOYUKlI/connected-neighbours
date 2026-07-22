import { Link } from 'react-router-dom';

import { PageContainer } from '../../components/layout/PageContainer';
import { buttonStyles } from '../../components/ui/buttonStyles';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingState } from '../../components/ui/LoadingState';
import { getEntityId } from '../../shared/utils/entities';
import { AlertCard } from './components/AlertCard';
import { useIncidentAlerts } from './hooks/useIncidentAlerts';

export function IncidentAlertsPage() {
  const { incidentId, incident, alerts, isLoading, error } = useIncidentAlerts();

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Chargement des alertes…" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage message={error} />
      </PageContainer>
    );
  }

  if (!incident) {
    return (
      <PageContainer className="grid gap-4">
        <EmptyState icon="bell" message="Incident introuvable." />
        <Link className={buttonStyles('ghost', 'sm', 'w-fit')} to="/app/local?tab=incidents">
          Retour aux incidents
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className={buttonStyles('ghost', 'sm', 'w-fit')} to="/app/incidents">
            Retour aux incidents
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Alertes - {incident.title}
          </h1>
        </div>
        <Link
          className={buttonStyles('primary', 'md')}
          to={`/app/incidents/${incidentId}/alerts/new`}
        >
          Signaler une alerte
        </Link>
      </header>

      {alerts.length === 0 ? (
        <EmptyState icon="bell" message="Aucune alerte pour cet incident." />
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <AlertCard alert={alert} key={getEntityId(alert)} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
