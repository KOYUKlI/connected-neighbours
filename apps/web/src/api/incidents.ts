import { apiRequest } from './client';

export type IncidentType =
  | 'security'
  | 'maintenance'
  | 'nuisance'
  | 'cleanliness'
  | 'traffic'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus =
  | 'reported'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export type IncidentItem = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  neighborhoodId: string;
  reportedById?: string | null;
  reporterName?: string | null;
  source: 'web' | 'admin_web' | 'javafx';
  externalId?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateIncidentInput = {
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  neighborhoodId: string;
};

export function createIncident(input: CreateIncidentInput) {
  return apiRequest<IncidentItem>('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getIncidents() {
  return apiRequest<IncidentItem[]>('/api/incidents');
}

export function getIncident(id: string) {
  return apiRequest<IncidentItem | null>(`/api/incidents/${id}`);
}
