import { apiRequest } from './client';

export type NeighborhoodItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  city?: string;
  postalCode?: string;
  status?: 'active' | 'archived';
  isActive?: boolean;
};

export function getNeighborhoods() {
  return apiRequest<NeighborhoodItem[]>('/api/neighborhoods');
}
