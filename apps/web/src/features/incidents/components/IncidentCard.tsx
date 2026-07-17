import type { IncidentItem } from '../../../api/incidents';
import { SeverityBadge } from '../../../shared/components/SeverityBadge';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { formatDate } from '../../../shared/utils/format';

type IncidentCardProps = {
  incident: IncidentItem;
  onOpenAlerts: (incident: IncidentItem) => void;
};

export function IncidentCard({ incident, onOpenAlerts }: IncidentCardProps) {
  return (
    <article className="service-card">
      <div className="card-heading">
        <div>
          <h3>{incident.title}</h3>
          <p>{incident.description}</p>
        </div>
        <div className="card-heading-badges">
          <SeverityBadge value={incident.severity} />
          <StatusBadge value={incident.status} />
        </div>
      </div>

      <dl className="details-grid">
        <div>
          <dt>Signale par</dt>
          <dd>{incident.reporterName ?? 'Anonyme'}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{incident.type}</dd>
        </div>
        <div>
          <dt>Quartier</dt>
          <dd>{incident.neighborhoodId}</dd>
        </div>
        <div>
          <dt>Creation</dt>
          <dd>{formatDate(incident.createdAt)}</dd>
        </div>
      </dl>

      <div className="action-row">
        <button
          className="secondary-button"
          onClick={() => onOpenAlerts(incident)}
          type="button"
        >
          Voir les alertes
        </button>
      </div>
    </article>
  );
}
