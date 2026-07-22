import type { AlertSeverity, AlertStatus } from '../../api/alerts';
import type { BadgeTone } from '../../components/ui/Badge';

export const alertStatusLabels: Record<AlertStatus, string> = {
  created: 'Créée',
  open: 'Ouverte',
  in_progress: 'En cours',
  resolved: 'Résolue',
  closed: 'Fermée',
};

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

export function getAlertStatusTone(status: AlertStatus): BadgeTone {
  if (status === 'resolved' || status === 'closed') return 'success';
  if (status === 'in_progress') return 'info';
  return 'warning';
}

export function getAlertSeverityTone(severity: AlertSeverity): BadgeTone {
  if (severity === 'critical' || severity === 'high') return 'danger';
  if (severity === 'medium') return 'warning';
  return 'success';
}
