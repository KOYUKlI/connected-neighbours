import { apiRequest } from './client';
import type { ServiceItem } from './services';

export type ContractStatus =
  | 'draft'
  | 'sent'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type ContractItem = {
  _id?: string;
  id?: string;
  serviceId: string;
  applicationId?: string | null;
  requesterId: string;
  providerId: string;
  payerId: string;
  receiverId: string;
  pricePoints: number;
  status: ContractStatus;
  signedByIds: string[];
  signedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractCreationResult = {
  service: ServiceItem;
  contract: ContractItem;
};

export function createContractFromApplication(applicationId: string) {
  return apiRequest<ContractCreationResult>(
    `/api/contracts/from-application/${applicationId}`,
    {
      method: 'POST',
    },
  );
}

export function getContracts() {
  return apiRequest<ContractItem[]>('/api/contracts');
}

export function getContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}`);
}

export function signContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}/sign`, {
    method: 'POST',
  });
}

export function completeContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}/complete`, {
    method: 'POST',
  });
}

export function cancelContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}/cancel`, {
    method: 'POST',
  });
}
