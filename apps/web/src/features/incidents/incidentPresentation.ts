import type { IncidentSeverity, IncidentStatus, IncidentType } from '../../api/incidents';
import type { BadgeTone } from '../../components/ui/Badge';

export const incidentTypeLabels: Record<IncidentType, string> = {
  security: 'Sécurité',
  maintenance: 'Maintenance',
  nuisance: 'Nuisance',
  cleanliness: 'Propreté',
  traffic: 'Circulation',
  other: 'Autre',
};

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  reported: 'Signalé',
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
  rejected: 'Rejeté',
};

export const incidentSeverityLabels: Record<IncidentSeverity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

export function getIncidentStatusTone(status: IncidentStatus): BadgeTone {
  if (status === 'resolved' || status === 'closed') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'in_progress') return 'info';
  return 'warning';
}

export function getIncidentSeverityTone(severity: IncidentSeverity): BadgeTone {
  if (severity === 'critical' || severity === 'high') return 'danger';
  if (severity === 'medium') return 'warning';
  return 'success';
}
