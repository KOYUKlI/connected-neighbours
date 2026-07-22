import type { AdminAlertRow } from '../../../api/admin';
import { AdminBadge } from '../../../components/ui/AdminList';
import { Button } from '../../../components/ui/Button';

type AlertWidgetProps = {
  alert: AdminAlertRow;
  onEdit: (alert: AdminAlertRow) => void;
  onResolve: (alert: AdminAlertRow) => void;
};

export function AlertWidget({ alert, onEdit, onResolve }: AlertWidgetProps) {
  const canResolve = !['resolved', 'closed'].includes(alert.status ?? '');

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{alert.title ?? 'Alerte'}</h3>
          {alert.details ? (
            <p className="mt-1 text-sm leading-6 text-slate-700">{alert.details}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminBadge tone={getSeverityTone(alert.severity)}>
            {formatSeverity(alert.severity)}
          </AdminBadge>
          <AdminBadge tone={getAlertStatusTone(alert.status)}>
            {formatAlertStatus(alert.status)}
          </AdminBadge>
        </div>
      </header>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Signalée par {alert.reporterName ?? 'Anonyme'} · {formatDate(alert.createdAt)}
          {alert.resolvedAt ? ` · résolue le ${formatDate(alert.resolvedAt)}` : ''}
        </span>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(alert)} size="sm" variant="ghost">
            Modifier
          </Button>
          {canResolve ? (
            <Button onClick={() => onResolve(alert)} size="sm" variant="secondary">
              Résoudre
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function formatSeverity(severity?: string) {
  const labels: Record<string, string> = {
    critical: 'Critique',
    high: 'Haute',
    low: 'Basse',
    medium: 'Moyenne',
  };

  return labels[severity ?? ''] ?? severity ?? 'Inconnue';
}

function formatAlertStatus(status?: string) {
  const labels: Record<string, string> = {
    closed: 'Fermée',
    created: 'Créée',
    in_progress: 'En cours',
    open: 'Ouverte',
    resolved: 'Résolue',
  };

  return labels[status ?? ''] ?? status ?? 'Inconnu';
}

function getSeverityTone(severity?: string) {
  if (severity === 'critical' || severity === 'high') return 'red' as const;
  if (severity === 'medium') return 'amber' as const;
  return 'emerald' as const;
}

function getAlertStatusTone(status?: string) {
  if (status === 'resolved' || status === 'closed') return 'emerald' as const;
  if (status === 'in_progress') return 'blue' as const;
  return 'amber' as const;
}
