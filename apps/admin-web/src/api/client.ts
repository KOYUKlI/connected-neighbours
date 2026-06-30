export const ADMIN_TOKEN_KEY = 'connected-neighbours.admin.token';

export type PublicUser = {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  neighborhoodId?: string;
  pointsBalance?: number;
  reservedPoints?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginResponse = {
  accessToken: string;
  user: PublicUser;
};

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
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function loginAdmin(email: string, password: string) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
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
