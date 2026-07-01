export const WEB_TOKEN_KEY = 'connected-neighbours.web.token';

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

type ApiErrorBody = {
  message?: unknown;
  error?: unknown;
};

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAuthToken() {
  return localStorage.getItem(WEB_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(WEB_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(WEB_TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const { auth = true, headers: requestHeaders, ...fetchOptions } = options;
  const headers = new Headers(requestHeaders);

  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAuthToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(path, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

    if (typeof body?.message === 'string') {
      return body.message;
    }

    if (Array.isArray(body?.message)) {
      return body.message.filter(Boolean).join(', ');
    }

    if (typeof body?.error === 'string') {
      return body.error;
    }
  }

  return response.statusText || 'Erreur API';
}
