const RETURN_TO_KEY = 'connected-neighbours.auth.return-to';

export function storePostLoginRedirect(value: string) {
  sessionStorage.setItem(RETURN_TO_KEY, sanitizeReturnPath(value));
}

export function takePostLoginRedirect() {
  const value = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return sanitizeReturnPath(value ?? '/');
}

function sanitizeReturnPath(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/';
}