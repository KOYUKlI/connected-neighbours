import type { AdminAlertRow } from '../../../api/admin';
import { SeverityBadge } from '../../../shared/components/SeverityBadge';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { formatDate } from '../../../shared/utils/format';

type AlertWidgetProps = {
  alert: AdminAlertRow;
};

export function AlertWidget({ alert }: AlertWidgetProps) {
  return (
    <article className="alert-widget">
      <header className="alert-widget-header">
        <h3>{alert.title ?? 'Alerte'}</h3>
        <div className="alert-widget-badges">
          <SeverityBadge value={alert.severity} />
          <StatusBadge value={alert.status} />
        </div>
      </header>

      {alert.details ? <p className="alert-widget-details">{alert.details}</p> : null}

      <footer className="alert-widget-footer">
        <span>Signalee par {alert.reporterName ?? 'Anonyme'}</span>
        <span>Creee le {formatDate(alert.createdAt)}</span>
        {alert.resolvedAt ? <span>Resolue le {formatDate(alert.resolvedAt)}</span> : null}
      </footer>
    </article>
  );
}
