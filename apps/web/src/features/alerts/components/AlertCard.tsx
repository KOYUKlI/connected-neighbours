import type { AlertItem } from '../../../api/alerts';
import { SeverityBadge } from '../../../shared/components/SeverityBadge';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { formatDate } from '../../../shared/utils/format';

export function AlertCard({ alert }: { alert: AlertItem }) {
  return (
    <article className="service-card">
      <div className="card-heading">
        <div>
          <h3>{alert.title}</h3>
          <p>{alert.details}</p>
        </div>
        <div className="card-heading-badges">
          <SeverityBadge value={alert.severity} />
          <StatusBadge value={alert.status} />
        </div>
      </div>

      <dl className="details-grid">
        <div>
          <dt>Signale par</dt>
          <dd>{alert.reporterName ?? 'Anonyme'}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{alert.source}</dd>
        </div>
        <div>
          <dt>Creation</dt>
          <dd>{formatDate(alert.createdAt)}</dd>
        </div>
      </dl>
    </article>
  );
}
