import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingState } from '../../components/ui/LoadingState';
import { IncidentsListPage } from '../../pages/IncidentsListPage';
import { useIncidentsPage } from './hooks/useIncidentsPage';
import { IncidentDetailPanel } from './IncidentDetailPanel';

export function IncidentsPage() {
  const {
    incidents,
    neighborhoods,
    selectedId,
    loading,
    error,
    reload,
    openIncident,
    closeDetail,
    handleResolve,
    handleClose,
  } = useIncidentsPage();

  if (selectedId) {
    return (
      <IncidentDetailPanel
        incidentId={selectedId}
        onBack={closeDetail}
        onChanged={() => void reload()}
      />
    );
  }

  if (loading) return <LoadingState message="Chargement des incidents…" />;

  return (
    <div className="grid gap-4">
      {error ? <ErrorMessage message={error} /> : null}
      <IncidentsListPage
        incidents={incidents}
        neighborhoods={neighborhoods}
        onClose={(incident) => void handleClose(incident)}
        onResolve={(incident) => void handleResolve(incident)}
        onSelect={(incident) => incident.id && openIncident(incident.id)}
      />
    </div>
  );
}
