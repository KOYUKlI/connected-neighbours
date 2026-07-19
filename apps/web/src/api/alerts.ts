import { apiRequest } from './client';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'created' | 'open' | 'in_progress' | 'resolved' | 'closed';

export type AlertItem = {
  _id?: string;
  id?: string;
  incidentId: string;
  title: string;
  details: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: 'web' | 'admin_web' | 'javafx';
  externalId?: string | null;
  reportedById?: string | null;
  reporterName?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
};

export type CreateAlertInput = {
  title: string;
  details: string;
  severity: AlertSeverity;
};

export function createAlert(incidentId: string, input: CreateAlertInput) {
  return apiRequest<AlertItem>(`/api/incidents/${incidentId}/alerts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getIncidentAlerts(incidentId: string) {
  return apiRequest<AlertItem[]>(`/api/incidents/${incidentId}/alerts`);
}
