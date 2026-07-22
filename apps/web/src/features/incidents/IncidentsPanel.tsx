import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingState } from '../../components/ui/LoadingState';
import { getEntityId } from '../../shared/utils/entities';
import { IncidentCard } from './components/IncidentCard';
import { IncidentForm } from './components/IncidentForm';
import { useIncidentsPage } from './hooks/useIncidentsPage';

export function IncidentsPanel() {
  const {
    currentUser,
    myIncidents,
    otherIncidents,
    isLoading,
    error,
    actionPending,
    isCreating,
    startCreating,
    cancelCreating,
    handleCreate,
    handleOpenAlerts,
  } = useIncidentsPage();

  if (isLoading) {
    return <LoadingState message="Chargement des incidents…" />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        {isCreating ? (
          <Button onClick={cancelCreating} variant="ghost">
            Annuler
          </Button>
        ) : (
          <Button onClick={startCreating} variant="primary">
            + Signaler un incident
          </Button>
        )}
      </div>

      {isCreating ? (
        <IncidentForm
          currentUser={currentUser}
          isPending={actionPending === 'create-incident'}
          onCreate={handleCreate}
        />
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-lg font-extrabold text-slate-950">Mes incidents</h2>
        {myIncidents.length === 0 ? (
          <EmptyState icon="activity" message="Vous n'avez signalé aucun incident." />
        ) : (
          <div className="grid gap-4">
            {myIncidents.map((incident) => (
              <IncidentCard
                incident={incident}
                key={getEntityId(incident)}
                onOpenAlerts={handleOpenAlerts}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-extrabold text-slate-950">Incidents du quartier</h2>
        {otherIncidents.length === 0 ? (
          <EmptyState icon="activity" message="Aucun autre incident signalé dans votre quartier." />
        ) : (
          <div className="grid gap-4">
            {otherIncidents.map((incident) => (
              <IncidentCard
                incident={incident}
                key={getEntityId(incident)}
                onOpenAlerts={handleOpenAlerts}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
