import type { AlertItem } from '../../../api/alerts';
import { Badge } from '../../../components/ui/Badge';
import { formatDate } from '../../../shared/utils/format';
import {
  alertSeverityLabels,
  alertStatusLabels,
  getAlertSeverityTone,
  getAlertStatusTone,
} from '../alertPresentation';

export function AlertCard({ alert }: { alert: AlertItem }) {
  return (
    <article className="grid gap-4 rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-slate-950">{alert.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{alert.details}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getAlertSeverityTone(alert.severity)}>
            {alertSeverityLabels[alert.severity]}
          </Badge>
          <Badge tone={getAlertStatusTone(alert.status)}>{alertStatusLabels[alert.status]}</Badge>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Signalé par
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">
            {alert.reporterName ?? 'Anonyme'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{alert.source}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Création
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">
            {formatDate(alert.createdAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
