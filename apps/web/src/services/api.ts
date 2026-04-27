import { apiFetch } from '../lib/http';
import type {
  AcceptServiceResult,
  ContractItem,
  CreateServiceInput,
  PointTransactionItem,
  ServiceItem,
} from './types';

export function getServices() {
  return apiFetch<ServiceItem[]>('/services');
}

export function createService(input: CreateServiceInput) {
  return apiFetch<ServiceItem>('/services', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      pricePoints: input.isPaid ? Number(input.pricePoints ?? 0) : undefined,
    }),
  });
}

export function acceptService(serviceId: string) {
  return apiFetch<AcceptServiceResult>(`/contracts/services/${serviceId}/accept`, {
    method: 'POST',
  });
}

export function getContracts() {
  return apiFetch<ContractItem[]>('/contracts');
}

export function signContract(contractId: string) {
  return apiFetch<ContractItem>(`/contracts/${contractId}/sign`, {
    method: 'POST',
  });
}

export function completeContract(contractId: string) {
  return apiFetch<ContractItem>(`/contracts/${contractId}/complete`, {
    method: 'POST',
  });
}

export function getPointTransactions() {
  return apiFetch<PointTransactionItem[]>('/points/transactions');
}
