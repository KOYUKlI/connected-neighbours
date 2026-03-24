import { API_BASE_URL } from '../lib/env';
import type { CreateServiceInput, ServiceItem } from './types';

type ApiErrorShape = {
  message?: string | string[];
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';

  let payload: unknown = null;

  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const data = payload as ApiErrorShape | string | null;

    let message = `Erreur HTTP ${response.status}`;

    if (typeof data === 'string' && data.trim()) {
      message = data;
    } else if (data && typeof data === 'object' && 'message' in data) {
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        message = data.message;
      }
    }

    throw new Error(message);
  }

  return payload as T;
}

export async function getServices(): Promise<ServiceItem[]> {
  const response = await fetch(`${API_BASE_URL}/services`, {
    credentials: 'include',
  });

  return parseResponse<ServiceItem[]>(response);
}

export async function createService(
  input: CreateServiceInput,
): Promise<ServiceItem> {
  const response = await fetch(`${API_BASE_URL}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...input,
      pricePoints: input.isPaid ? Number(input.pricePoints ?? 0) : undefined,
    }),
  });

  return parseResponse<ServiceItem>(response);
}