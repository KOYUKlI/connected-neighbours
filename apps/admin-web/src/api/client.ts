export const ADMIN_TOKEN_KEY = 'connected-neighbours.admin.token';
export const ADMIN_AUTH_EXPIRED_EVENT = 'connected-neighbours:admin-auth-expired';

export type PublicUser = {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  neighborhoodId?: string;
  pointsBalance?: number;
  reservedPoints?: number;
  identityProvider?: 'local' | 'keycloak' | 'linked';
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginResponse = {
  accessToken: string;
  user: PublicUser;
};

type AdminSecuritySummary = {
  session: {
    provider: 'local' | 'keycloak';
    mfaSatisfied: boolean;
    authenticationMethods: string[];
  };
};

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

type ApiErrorBody = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
};

type AuthTokenProvider = () => Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function configureAuthTokenProvider(provider: AuthTokenProvider | null) {
  authTokenProvider = provider;
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

export function getCurrentAdmin() {
  return apiRequest<PublicUser>('/api/auth/me');
}

export function getAdminSecurity() {
  return apiRequest<AdminSecuritySummary>('/api/auth/security');
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
    let token: string | null;
    try {
      token = authTokenProvider
        ? await authTokenProvider()
        : getAuthToken();
    } catch {
      window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
      throw new ApiError(
        'Votre session a expiré. Connectez-vous à nouveau.',
        401,
        'session_expired',
      );
    }

    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...fetchOptions, headers });

  if (!response.ok) {
    const error = await readError(response);
    if (response.status === 401 && auth) {
      removeAuthToken();
      window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(error.message, response.status, error.code);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function readError(response: Response) {
  const fallback = response.statusText || 'Erreur API';
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { message: fallback, code: null };
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  let message = fallback;
  if (typeof body?.message === 'string') message = body.message;
  else if (Array.isArray(body?.message)) {
    message = body.message.filter(Boolean).join(', ');
  } else if (typeof body?.error === 'string') message = body.error;

  return {
    message,
    code: typeof body?.code === 'string' ? body.code : null,
  };
}