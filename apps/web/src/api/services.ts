import { apiRequest } from './client';

export type ServiceType = 'offer' | 'request';

export type ServiceStatus =
  | 'draft'
  | 'published'
  | 'application_received'
  | 'candidate_selected'
  | 'contract_pending'
  | 'awaiting_signatures'
  | 'contract_active'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type ServiceItem = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  type: ServiceType;
  category: string;
  availability: string;
  neighborhoodId: string;
  ownerId: string;
  isPaid: boolean;
  pricePoints: number | null;
  status: ServiceStatus;
  selectedApplicationId?: string | null;
  contractId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateServiceInput = {
  title: string;
  description: string;
  type: ServiceType;
  category: string;
  availability: string;
  neighborhoodId: string;
  isPaid: boolean;
  pricePoints?: number;
  status?: ServiceStatus;
};

export function getServices() {
  return apiRequest<ServiceItem[]>('/api/services');
}

export function getService(id: string) {
  return apiRequest<ServiceItem>(`/api/services/${id}`);
}

export function createService(input: CreateServiceInput) {
  return apiRequest<ServiceItem>('/api/services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function publishService(id: string) {
  return apiRequest<ServiceItem>(`/api/services/${id}/publish`, {
    method: 'POST',
  });
}

export function cancelService(id: string) {
  return apiRequest<ServiceItem>(`/api/services/${id}/cancel`, {
    method: 'POST',
  });
}
