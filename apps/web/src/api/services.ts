import { apiRequest } from './client';

export type PublicUserSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  neighborhoodId: string;
  reputationScore: number | null;
  completedServicesCount: number;
};

export type NeighborhoodSummary = {
  id: string;
  name: string;
  city?: string | null;
};

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

export type ServiceViewer = {
  isOwner: boolean;
  hasApplied: boolean;
  applicationId: string | null;
  applicationStatus: string | null;
  canApply: boolean;
  canManage: boolean;
};

export type ServicePermissions = {
  canEdit: boolean;
  canPublish: boolean;
  canCancel: boolean;
  canApply: boolean;
  canViewApplications: boolean;
  canGenerateContract: boolean;
  canViewContract: boolean;
};

export type ContractSummary = {
  id: string;
  status: string;
  pricePoints: number;
  signaturesCount: number;
  requiredSignaturesCount: number;
};

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
  neighborhood?: NeighborhoodSummary | null;
  owner?: PublicUserSummary | null;
  applicationsCount?: number;
  viewer?: ServiceViewer;
  permissions?: ServicePermissions;
  contractSummary?: ContractSummary | null;
};

export type InvolvedServiceItem = ServiceItem & {
  involvement: {
    role: 'applicant' | 'requester' | 'provider';
    applicationStatus: string | null;
    contractStatus: string | null;
    nextAction: string | null;
  };
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

export function getMyCreatedServices() {
  return apiRequest<ServiceItem[]>('/api/services/me/created');
}

export function getMyInvolvedServices() {
  return apiRequest<InvolvedServiceItem[]>('/api/services/me/involved');
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
