import { apiRequest } from './client';

export type NeighborhoodItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  city?: string;
  postalCode?: string;
  postalCodes?: string[];
  description?: string;
  status?: 'active' | 'archived';
  isActive?: boolean;
  geometryDefined?: boolean;
  center?: { type: 'Point'; coordinates: [number, number] } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MyNeighborhoodResponse = {
  assigned: boolean;
  neighborhood: NeighborhoodItem | null;
  assignment: {
    assignedAt: string | null;
    source: 'admin' | 'resident_confirmation' | 'seed' | 'system' | null;
    exactPositionStored: false;
  } | null;
};

export type NeighborhoodResolution = {
  status: 'found' | 'not_found';
  neighborhood: NeighborhoodItem | null;
  confirmationExpiresAt?: string;
};

export function getNeighborhoods() {
  return apiRequest<NeighborhoodItem[]>('/api/neighborhoods');
}

export function getMyNeighborhood() {
  return apiRequest<MyNeighborhoodResponse>('/api/neighborhoods/me');
}

export function resolveMyNeighborhood(longitude: number, latitude: number) {
  return apiRequest<NeighborhoodResolution>('/api/neighborhoods/resolve', {
    method: 'POST',
    body: JSON.stringify({ type: 'Point', coordinates: [longitude, latitude] }),
  });
}

export function confirmMyNeighborhood() {
  return apiRequest<{
    assigned: true;
    neighborhood: NeighborhoodItem;
    exactPositionStored: false;
    sessionRefreshRequired: true;
  }>('/api/neighborhoods/me/confirm', { method: 'POST' });
}
