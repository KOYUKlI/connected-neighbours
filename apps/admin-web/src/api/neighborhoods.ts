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
  boundary: GeoJsonPolygon;
  createdById?: string;
  status?: NeighborhoodStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type NeighborhoodInput = {
  name: string;
  slug: string;
  description: string;
  city: string;
  postalCode: string;
  boundary: GeoJsonPolygon;
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
  return apiRequest<NeighborhoodItem[]>('/api/neighborhoods?includeArchived=true');
}

export function createNeighborhood(input: NeighborhoodInput) {
  return apiRequest<NeighborhoodItem>('/api/neighborhoods', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateNeighborhood(id: string, input: Partial<NeighborhoodInput>) {
  return apiRequest<NeighborhoodItem>(`/api/neighborhoods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveNeighborhood(id: string) {
  return apiRequest<{ archived: boolean; id: string; neighborhood: NeighborhoodItem }>(
    `/api/neighborhoods/${id}`,
    {
      method: 'DELETE',
    },
  );
}

export function fetchNeighborhoodMembers(id: string) {
  return apiRequest<NeighborhoodMember[]>(`/api/neighborhoods/${id}/members`);
}

export function fetchNeighborhoodStats(id: string) {
  return apiRequest<NeighborhoodStats>(`/api/neighborhoods/${id}/stats`);
}
