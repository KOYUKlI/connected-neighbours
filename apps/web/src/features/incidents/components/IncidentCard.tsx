import type { IncidentItem } from '../../../api/incidents';
import { Badge } from '../../../components/ui/Badge';
import { buttonStyles } from '../../../components/ui/buttonStyles';
import { formatDate } from '../../../shared/utils/format';
import {
  getIncidentSeverityTone,
  getIncidentStatusTone,
  incidentSeverityLabels,
  incidentStatusLabels,
  incidentTypeLabels,
} from '../incidentPresentation';

type IncidentCardProps = {
  incident: IncidentItem;
  onOpenAlerts: (incident: IncidentItem) => void;
};

export function IncidentCard({ incident, onOpenAlerts }: IncidentCardProps) {
  return (
    <article className="grid gap-4 rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-slate-950">{incident.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{incident.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getIncidentSeverityTone(incident.severity)}>
            {incidentSeverityLabels[incident.severity]}
          </Badge>
          <Badge tone={getIncidentStatusTone(incident.status)}>
            {incidentStatusLabels[incident.status]}
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Signalé par
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">
            {incident.reporterName ?? 'Anonyme'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">
            {incidentTypeLabels[incident.type]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quartier</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{incident.neighborhoodId}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Création</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">
            {formatDate(incident.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="flex justify-end">
        <button
          className={buttonStyles('secondary', 'sm')}
          onClick={() => onOpenAlerts(incident)}
          type="button"
        >
          Voir les alertes
        </button>
      </div>
    </article>
  );
}
