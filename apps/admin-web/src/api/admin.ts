import { apiRequest } from './client';

export type AdminDashboard = {
  totalServices: number;
  publishedServices: number;
  completedServices: number;
  totalApplications: number;
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  totalAlerts: number;
  openAlerts: number;
  knownSyncClients: number;
  serverTime: string;
};

export type AdminServiceRow = {
  id: string | null;
  title?: string;
  category?: string;
  status?: string;
  ownerId?: string;
  neighborhoodId?: string;
  pricePoints?: number;
  selectedApplicationId?: string;
  contractId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminContractRow = {
  id: string | null;
  serviceId?: string;
  applicationId?: string;
  requesterId?: string;
  providerId?: string;
  payerId?: string;
  receiverId?: string;
  pricePoints?: number;
  status?: string;
  signedByIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminIncidentRow = {
  id: string | null;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  severity?: string;
  neighborhoodId?: string;
  source?: string;
  externalId?: string;
  lastSyncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminAlertRow = {
  id: string | null;
  incidentId?: string;
  title?: string;
  details?: string;
  severity?: string;
  status?: string;
  source?: string;
  externalId?: string | null;
  reportedById?: string | null;
  reporterName?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
};

export type AlertSeverityInput = 'low' | 'medium' | 'high' | 'critical';

export type IncidentTypeInput =
  | 'security'
  | 'maintenance'
  | 'nuisance'
  | 'cleanliness'
  | 'traffic'
  | 'other';

export type CreateAlertInput = {
  title: string;
  details: string;
  severity: AlertSeverityInput;
};

export type UpdateAlertInput = Partial<CreateAlertInput>;

export type UpdateIncidentInput = {
  title?: string;
  description?: string;
  type?: IncidentTypeInput;
  severity?: AlertSeverityInput;
};

export type AdminSyncStateRow = {
  id: string | null;
  clientId?: string;
  status?: string;
  lastPullAt?: string | null;
  lastPushAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
  lastError?: string | null;
  updatedAt?: string;
};

export type AdminUserRow = {
  id: string | null;
  email?: string;
  displayName?: string;
  role?: string;
  neighborhoodId?: string;
  pointsBalance?: number;
  reservedPoints?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function fetchDashboard() {
  return apiRequest<AdminDashboard>('/api/admin/dashboard');
}

export function fetchServices() {
  return apiRequest<AdminServiceRow[]>('/api/admin/services');
}

export function fetchContracts() {
  return apiRequest<AdminContractRow[]>('/api/admin/contracts');
}

export function fetchIncidents() {
  return apiRequest<AdminIncidentRow[]>('/api/admin/incidents');
}

export function fetchIncident(id: string) {
  return apiRequest<AdminIncidentRow | null>(`/api/admin/incidents/${id}`);
}

export function fetchIncidentAlerts(id: string) {
  return apiRequest<AdminAlertRow[]>(`/api/admin/incidents/${id}/alerts`);
}

export async function createIncidentAlert(incidentId: string, input: CreateAlertInput) {
  const raw = await apiRequest<RawEntity<AdminAlertRow>>(`/api/incidents/${incidentId}/alerts`, {
    method: 'POST',
    body: JSON.stringify({ ...input, source: 'admin_web' }),
  });

  return normalizeId(raw);
}

export async function updateIncident(id: string, input: UpdateIncidentInput) {
  const raw = await apiRequest<RawEntity<AdminIncidentRow>>(`/api/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return normalizeId(raw);
}

export async function resolveIncident(id: string) {
  const raw = await apiRequest<RawEntity<AdminIncidentRow>>(`/api/incidents/${id}/resolve`, {
    method: 'POST',
  });

  return normalizeId(raw);
}

export async function closeIncident(id: string) {
  const raw = await apiRequest<RawEntity<AdminIncidentRow>>(`/api/incidents/${id}/close`, {
    method: 'POST',
  });

  return normalizeId(raw);
}

export async function updateAlert(id: string, input: UpdateAlertInput) {
  const raw = await apiRequest<RawEntity<AdminAlertRow>>(`/api/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return normalizeId(raw);
}

export async function resolveAlert(id: string) {
  const raw = await apiRequest<RawEntity<AdminAlertRow>>(`/api/alerts/${id}/resolve`, {
    method: 'POST',
  });

  return normalizeId(raw);
}

type RawEntity<T> = Omit<T, 'id'> & { id?: string | null; _id?: string };

function normalizeId<T extends { id?: string | null }>(raw: RawEntity<T>): T {
  const { _id, ...rest } = raw;

  return { ...rest, id: rest.id ?? _id ?? null } as T;
}

export function fetchSyncStates() {
  return apiRequest<AdminSyncStateRow[]>('/api/admin/sync/status');
}

export function fetchUsers() {
  return apiRequest<AdminUserRow[]>('/api/admin/users');
}
