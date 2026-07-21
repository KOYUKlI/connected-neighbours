import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getMe, login as loginRequest } from '../api/auth';
import type { AuthUser, LoginInput } from '../api/auth';
import {
  AUTH_EXPIRED_EVENT,
  ApiError,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '../api/client';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const clearSession = useCallback((message?: string) => {
    clearAuthToken();
    setToken(null);
    setUser(null);
    setSessionMessage(message ?? null);
    setLoginError(message ?? null);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = getAuthToken();

      if (!storedToken) {
        setIsReady(true);
        return;
      }

      try {
        const profile = await getMe();
        setToken(storedToken);
        setUser(profile);
      } catch {
        clearSession('Votre session a expiré. Connectez-vous à nouveau.');
      } finally {
        setIsReady(true);
      }
    }

    void bootstrap();
  }, [clearSession]);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearSession('Votre session a expiré. Connectez-vous à nouveau.');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () =>
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, [clearSession]);

  const login = useCallback(
    async (input: LoginInput, persistent = true) => {
      setLoginError(null);
      const result = await loginRequest(input);
      setAuthToken(result.accessToken, persistent);
      setToken(result.accessToken);
      setUser(result.user);
      setSessionMessage(null);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const profile = await getMe();
    setUser(profile);
  }, []);

  const handleSessionError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        clearSession('Votre session a expiré. Connectez-vous à nouveau.');
        return true;
      }

      return false;
    },
    [clearSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      currentUser: user,
      token,
      isReady,
      sessionMessage,
      loginError,
      login,
      logout,
      clearSession,
      refreshUser,
      handleSessionError,
    }),
    [
      user,
      token,
      isReady,
      sessionMessage,
      loginError,
      login,
      logout,
      clearSession,
      refreshUser,
      handleSessionError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}