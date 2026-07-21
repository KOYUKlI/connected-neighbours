import { apiRequest } from './client';
import type { PublicUserSummary, ServiceStatus, ServiceType } from './services';

export type ApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ApplicationServiceSummary = {
  id: string;
  title: string;
  type: ServiceType;
  category: string;
  status: ServiceStatus;
  neighborhoodId: string;
  isPaid: boolean;
  pricePoints: number | null;
};

export type ServiceApplication = {
  _id?: string;
  id?: string;
  serviceId: string;
  applicantId: string;
  ownerId: string;
  message: string;
  proposedDate?: string | null;
  proposedPricePoints?: number | null;
  status: ApplicationStatus;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  applicant?: PublicUserSummary | null;
  owner?: PublicUserSummary | null;
  service?: ApplicationServiceSummary | null;
};

export type CreateApplicationInput = {
  message: string;
  proposedDate?: string;
  proposedPricePoints?: number;
};

export function createApplication(
  serviceId: string,
  input: CreateApplicationInput,
) {
  return apiRequest<ServiceApplication>(
    `/api/services/${serviceId}/applications`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function getApplicationsForService(serviceId: string) {
  return apiRequest<ServiceApplication[]>(
    `/api/services/${serviceId}/applications`,
  );
}

export function getMyApplications() {
  return apiRequest<ServiceApplication[]>('/api/applications/me');
}

export function acceptApplication(id: string) {
  return apiRequest<ServiceApplication>(`/api/applications/${id}/accept`, {
    method: 'POST',
  });
}

export function rejectApplication(id: string) {
  return apiRequest<ServiceApplication>(`/api/applications/${id}/reject`, {
    method: 'POST',
  });
}

export function withdrawApplication(id: string) {
  return apiRequest<ServiceApplication>(`/api/applications/${id}/withdraw`, {
    method: 'POST',
  });
}
