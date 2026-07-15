import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';

import {
  ApiError,
  getAuthToken,
  loginAdmin,
  removeAuthToken,
  setAuthToken,
} from '../api/client';
import type { PublicUser } from '../api/client';
import { getErrorMessage } from '../shared/utils/errors';
import { AdminAuthContext } from './AdminAuthContext';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const clearSession = useCallback((message?: string) => {
    removeAuthToken();
    setToken(null);
    setCurrentUser(null);
    setLoginError(message ?? null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);

    try {
      const response = await loginAdmin(email, password);

      if (response.user.role !== 'admin') {
        setLoginError('Ce compte ne dispose pas du role admin.');
        return false;
      }

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
        clearSession('Session expiree ou role admin requis.');
        return true;
      }

      return false;
    },
    [clearSession],
  );

  return (
    <AdminAuthContext.Provider
      value={{ token, currentUser, loginError, login, clearSession, handleSessionError }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
