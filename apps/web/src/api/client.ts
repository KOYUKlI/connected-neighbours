export const WEB_TOKEN_KEY = 'connected-neighbours.web.token';
export const WEB_SESSION_TOKEN_KEY = 'connected-neighbours.web.session-token';
export const AUTH_EXPIRED_EVENT = 'connected-neighbours:auth-expired';

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
  return (
    sessionStorage.getItem(WEB_SESSION_TOKEN_KEY) ??
    localStorage.getItem(WEB_TOKEN_KEY)
  );
}

export function setAuthToken(token: string, persistent = true) {
  clearAuthToken();

  if (persistent) {
    localStorage.setItem(WEB_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(WEB_SESSION_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(WEB_TOKEN_KEY);
  sessionStorage.removeItem(WEB_SESSION_TOKEN_KEY);
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
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      throw new ApiError(
        'Votre session a expiré. Connectez-vous à nouveau.',
        401,
        'session_expired',
      );
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(path, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await readError(response);

    if (response.status === 401 && auth) {
      clearAuthToken();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    throw new ApiError(error.message, response.status, error.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

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

  if (typeof body?.message === 'string') {
    message = body.message;
  } else if (Array.isArray(body?.message)) {
    message = body.message.filter(Boolean).join(', ');
  } else if (typeof body?.error === 'string') {
    message = body.error;
  }

  return {
    message,
    code: typeof body?.code === 'string' ? body.code : null,
  };
}