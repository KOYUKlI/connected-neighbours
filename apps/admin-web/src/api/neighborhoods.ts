import { apiRequest } from './client';

export type CoordinatePair = [number, number];

export type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: CoordinatePair[][];
};

export type NeighborhoodStatus = 'active' | 'archived';

export type NeighborhoodItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  postalCode: string;
  postalCodes?: string[];
  boundary: GeoJsonPolygon;
  geometry?: GeoJsonPolygon | null;
  geometryDefined?: boolean;
  center?: { type: 'Point'; coordinates: CoordinatePair } | null;
  createdById?: string;
  status?: NeighborhoodStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
  history?: Array<{
    type: 'created' | 'updated' | 'archived' | 'restored' | 'user_assigned';
    actorId: string;
    occurredAt: string;
    metadata?: Record<string, unknown>;
  }>;
  stats?: NeighborhoodStats;
};

export type NeighborhoodInput = {
  name: string;
  slug: string;
  description: string;
  city: string;
  postalCode: string;
  postalCodes?: string[];
  geometry?: GeoJsonPolygon;
  boundary?: GeoJsonPolygon;
};

export type NeighborhoodMember = {
  _id?: string;
  id?: string;
  email?: string;
  displayName?: string;
  role?: string;
  neighborhoodId?: string;
  pointsBalance?: number;
  reservedPoints?: number;
};

export type NeighborhoodStats = {
  neighborhoodId: string;
  slug: string;
  users: number;
  services: number;
  incidents: number;
  events: number;
  votes: number;
};

export function fetchNeighborhoods() {
  return apiRequest<{ items: NeighborhoodItem[] }>('/api/admin/neighborhoods?limit=100')
    .then((response) => response.items);
}

export function createNeighborhood(input: NeighborhoodInput) {
  const geometry = input.geometry ?? input.boundary;
  return apiRequest<NeighborhoodItem>('/api/admin/neighborhoods', {
    method: 'POST',
    body: JSON.stringify({ ...input, geometry }),
  });
}

export function updateNeighborhood(id: string, input: Partial<NeighborhoodInput>) {
  const geometry = input.geometry ?? input.boundary;
  return apiRequest<NeighborhoodItem>(`/api/admin/neighborhoods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...input, ...(geometry ? { geometry } : {}) }),
  });
}

export function archiveNeighborhood(id: string) {
  return apiRequest<NeighborhoodItem>(`/api/admin/neighborhoods/${id}/archive`, {
    method: 'POST',
  });
}

export function restoreNeighborhood(id: string) {
  return apiRequest<NeighborhoodItem>(`/api/admin/neighborhoods/${id}/restore`, {
    method: 'POST',
  });
}

export function fetchNeighborhoodMembers(id: string) {
  return apiRequest<{ items: NeighborhoodMember[] }>(
    `/api/admin/neighborhoods/${id}/members?limit=100`,
  ).then((response) => response.items);
}

export function fetchNeighborhoodStats(id: string) {
  return apiRequest<NeighborhoodStats>(`/api/admin/neighborhoods/${id}/stats`);
}
