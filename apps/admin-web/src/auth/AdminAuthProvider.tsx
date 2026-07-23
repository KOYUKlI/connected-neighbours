import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ADMIN_AUTH_EXPIRED_EVENT,
  ApiError,
  configureAuthTokenProvider,
  getAdminSecurity,
  getAuthToken,
  getCurrentAdmin,
  loginAdmin,
  removeAuthToken,
  setAuthToken,
  type PublicUser,
} from '../api/client';
import { getErrorMessage } from '../shared/utils/errors';
import { AdminAuthContext, type AdminAuthContextValue, type AdminAuthMode } from './AdminAuthContext';
import {
  getAdminKeycloakToken,
  initializeAdminKeycloak,
  isAdminKeycloakEnabled,
  logoutAdminKeycloak,
  startAdminKeycloakLogin,
} from './keycloak';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const authMode: AdminAuthMode = isAdminKeycloakEnabled() ? 'keycloak' : 'local';
  const [token, setToken] = useState(() =>
    authMode === 'local' ? getAuthToken() : null,
  );
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const clearSession = useCallback((message?: string) => {
    removeAuthToken();
    setToken(null);
    setCurrentUser(null);
    setLoginError(message ?? null);
  }, []);

  const authorize = useCallback(async () => {
    const [user, security] = await Promise.all([
      getCurrentAdmin(),
      getAdminSecurity(),
    ]);
    if (!['admin', 'moderator'].includes(user.role)) {
      throw new ApiError(
        'Ce compte ne dispose pas d’un rôle de modération.',
        403,
      );
    }
    if (
      authMode === 'keycloak' &&
      security.session.provider === 'keycloak' &&
      !security.session.mfaSatisfied
    ) {
      throw new ApiError(
        'Une double authentification est requise pour le back-office.',
        403,
        'mfa_required',
      );
    }
    return user;
  }, [authMode]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (authMode === 'keycloak') {
          removeAuthToken();
          configureAuthTokenProvider(getAdminKeycloakToken);
          if (!(await initializeAdminKeycloak())) return;
        } else {
          configureAuthTokenProvider(null);
          if (!getAuthToken()) return;
        }

        const user = await authorize();
        if (active) setCurrentUser(user);
      } catch (error) {
        if (active) clearSession(getErrorMessage(error));
      } finally {
        if (active) setIsReady(true);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [authMode, authorize, clearSession]);

  useEffect(() => {
    const expired = () => clearSession('Votre session administrateur a expiré.');
    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, expired);
    return () => window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, expired);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);
    try {
      const response = await loginAdmin(email, password);
      if (!['admin', 'moderator'].includes(response.user.role)) {
        setLoginError('Ce compte ne dispose pas d’un rôle de modération.');
        return null;
      }
      setAuthToken(response.accessToken);
      configureAuthTokenProvider(null);
      setCurrentUser(response.user);
      setToken(response.accessToken);
      return response.user;
    } catch (error) {
      setLoginError(getErrorMessage(error));
      return null;
    }
  }, []);

  const loginWithKeycloak = useCallback(async () => {
    setLoginError(null);
    await startAdminKeycloakLogin();
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    if (authMode === 'keycloak') await logoutAdminKeycloak();
  }, [authMode, clearSession]);

  const handleSessionError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        clearSession('Session expirée ou rôle de modération requis.');
        return true;
      }
      return false;
    },
    [clearSession],
  );

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      token,
      currentUser,
      authMode,
      isReady,
      loginError,
      login,
      loginWithKeycloak,
      logout,
      clearSession,
      handleSessionError,
    }),
    [
      token,
      currentUser,
      authMode,
      isReady,
      loginError,
      login,
      loginWithKeycloak,
      logout,
      clearSession,
      handleSessionError,
    ],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}