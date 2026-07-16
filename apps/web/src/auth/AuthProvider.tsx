import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getMe, login as loginRequest } from '../api/auth';
import type { AuthUser } from '../api/auth';
import { ApiError, clearAuthToken, getAuthToken, setAuthToken } from '../api/client';
import { getErrorMessage } from '../shared/utils/errors';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const clearSession = useCallback((message?: string) => {
    clearAuthToken();
    setToken(null);
    setCurrentUser(null);
    setLoginError(message ?? null);
  }, []);

  useEffect(() => {
    if (!token || currentUser) {
      return;
    }

    let ignore = false;

    getMe()
      .then((profile) => {
        if (!ignore) {
          setCurrentUser(profile);
        }
      })
      .catch(() => {
        if (!ignore) {
          clearSession('Session expiree. Merci de vous reconnecter.');
        }
      });

    return () => {
      ignore = true;
    };
  }, [token, currentUser, clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);

    try {
      const response = await loginRequest({ email, password });
      setAuthToken(response.accessToken);
      setCurrentUser(response.user);
      setToken(response.accessToken);
      return true;
    } catch (error) {
      setLoginError(getErrorMessage(error));
      return false;
    }
  }, []);

  const handleSessionError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        clearSession('Session expiree. Merci de vous reconnecter.');
        return true;
      }

      return false;
    },
    [clearSession],
  );

  return (
    <AuthContext.Provider
      value={{ token, currentUser, loginError, login, clearSession, handleSessionError }}
    >
      {children}
    </AuthContext.Provider>
  );
}
