import { apiRequest } from '../api/client';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return apiRequest<T>(`/api${path.startsWith('/') ? path : `/${path}`}`, init);
}
