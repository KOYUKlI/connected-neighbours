import { apiFetch } from '../lib/http';
import type { CreateServiceInput, ServiceItem } from './types';

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