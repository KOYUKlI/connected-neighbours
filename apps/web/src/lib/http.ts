import { authStorage } from '../auth/storage';
import { API_BASE_URL } from './env';

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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = authStorage.getToken();

  const headers = new Headers(init?.headers ?? {});

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  return parseResponse<T>(response);
}