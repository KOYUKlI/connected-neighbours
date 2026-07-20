import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CreateIncidentInput, IncidentItem } from '../../api/incidents';
import { useAuth } from '../../auth/useAuth';
import { EmptyState } from '../../shared/components/EmptyState';
import { getEntityId } from '../../shared/utils/entities';
import { IncidentCard } from './components/IncidentCard';
import { IncidentForm } from './components/IncidentForm';
import { useIncidentsPage } from './hooks/useIncidentsPage';

export function IncidentsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { incidents, isLoading, error, actionPending, onCreateIncident } =
    useIncidentsPage();
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const myIncidents = incidents.filter(
    (incident) => incident.reportedById === currentUser?.id,
  );
  const otherIncidents = incidents.filter(
    (incident) =>
      incident.reportedById !== currentUser?.id &&
      incident.neighborhoodId === currentUser?.neighborhoodId,
  );

  function handleOpenAlerts(incident: IncidentItem) {
    const incidentId = getEntityId(incident);

    if (incidentId) {
      navigate(`/app/incidents/${incidentId}/alerts`);
    }
  }

  async function handleCreate(input: CreateIncidentInput) {
    const success = await onCreateIncident(input);

    if (success) {
      setIsCreating(false);
    }

    return success;
  }

  return (
    <div className="stack">
      <div className="section-header-row">
        <h2>Mes incidents</h2>
        {isCreating ? (
          <button className="ghost-button" onClick={() => setIsCreating(false)} type="button">
            Annuler
          </button>
        ) : (
          <button className="create-button" onClick={() => setIsCreating(true)} type="button">
            + Signaler un incident
          </button>
        )}
      </div>

      {isCreating ? (
        <IncidentForm
          currentUser={currentUser}
          isPending={actionPending === 'create-incident'}
          onCreate={handleCreate}
        />
      ) : null}

      {myIncidents.length === 0 ? (
        <EmptyState message="Vous n'avez signale aucun incident." />
      ) : (
        <div className="stack">
          {myIncidents.map((incident) => (
            <IncidentCard
              incident={incident}
              key={getEntityId(incident)}
              onOpenAlerts={handleOpenAlerts}
            />
          ))}
        </div>
      )}

      <div className="section-header-row">
        <h2>Incidents du quartier</h2>
      </div>

      {otherIncidents.length === 0 ? (
        <EmptyState message="Aucun autre incident signale dans votre quartier." />
      ) : (
        <div className="stack">
          {otherIncidents.map((incident) => (
            <IncidentCard
              incident={incident}
              key={getEntityId(incident)}
              onOpenAlerts={handleOpenAlerts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
