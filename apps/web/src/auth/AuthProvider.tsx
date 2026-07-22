import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  completeIdentityLink,
  getMe,
  login as loginRequest,
  requestIdentityLink,
  type AuthUser,
  type LoginInput,
} from '../api/auth';
import {
  AUTH_EXPIRED_EVENT,
  ApiError,
  clearAuthToken,
  configureAuthTokenProvider,
  getAuthToken,
  setAuthToken,
} from '../api/client';
import { AuthContext, type AuthContextValue, type AuthMode } from './AuthContext';
import { storePostLoginRedirect } from './redirect';
import {
  getKeycloakAccessToken,
  initializeKeycloak,
  isKeycloakAuthEnabled,
  logoutFromKeycloak,
  startKeycloakLogin,
  startKeycloakRegistration,
} from './keycloak';

const IDENTITY_LINK_TOKEN_KEY = 'connected-neighbours.identity-link-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const authMode: AuthMode = isKeycloakAuthEnabled() ? 'keycloak' : 'local';
  const [token, setToken] = useState<string | null>(() =>
    authMode === 'local' ? getAuthToken() : null,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [linkRequired, setLinkRequired] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const clearSession = useCallback((message?: string) => {
    clearAuthToken();
    setToken(null);
    setUser(null);
    setLinkRequired(false);
    setSessionMessage(message ?? null);
    setLoginError(message ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (authMode === 'keycloak') {
        clearAuthToken();
        configureAuthTokenProvider(getKeycloakAccessToken);
        try {
          const authenticated = await initializeKeycloak();
          if (!active || !authenticated) return;
          const profile = await getMe();
          if (active) setUser(profile);
        } catch (error) {
          if (!active) return;
          if (error instanceof ApiError && error.code === 'link_required') {
            setLinkRequired(true);
            setSessionMessage(error.message);
          } else {
            clearSession('Impossible de vérifier votre session Keycloak.');
          }
        } finally {
          if (active) setIsReady(true);
        }
        return;
      }

      configureAuthTokenProvider(null);
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsReady(true);
        return;
      }

      try {
        const profile = await getMe();
        if (!active) return;
        setToken(storedToken);
        setUser(profile);
      } catch {
        if (active) {
          clearSession('Votre session a expiré. Connectez-vous à nouveau.');
        }
      } finally {
        if (active) setIsReady(true);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [authMode, clearSession]);

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
      configureAuthTokenProvider(null);
      setToken(result.accessToken);
      setUser(result.user);
      setLinkRequired(false);
      setSessionMessage(null);
    },
    [],
  );

  const loginWithKeycloak = useCallback(async (returnTo = '/') => {
    storePostLoginRedirect(returnTo);
    await startKeycloakLogin(`${window.location.origin}/auth/callback`);
  }, []);

  const registerWithKeycloak = useCallback(async () => {
    storePostLoginRedirect('/');
    await startKeycloakRegistration(`${window.location.origin}/auth/callback`);
  }, []);

  const linkExistingAccount = useCallback(async (input: LoginInput) => {
    const keycloakToken = await getKeycloakAccessToken();
    if (!keycloakToken) throw new Error('Session Keycloak indisponible.');

    const localSession = await loginRequest(input);
    const request = await requestIdentityLink(localSession.accessToken);
    await completeIdentityLink(request.linkToken, keycloakToken);
    const profile = await getMe();
    setUser(profile);
    setLinkRequired(false);
    setSessionMessage('Votre identité Keycloak est maintenant liée.');
  }, []);

  const beginIdentityLink = useCallback(async () => {
    const request = await requestIdentityLink();
    sessionStorage.setItem(IDENTITY_LINK_TOKEN_KEY, request.linkToken);
    storePostLoginRedirect('/security');
    await startKeycloakLogin(
      `${window.location.origin}/auth/callback?identity-link=1`,
    );
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await getMe();
    setUser(profile);
  }, []);

  const completePendingIdentityLink = useCallback(async () => {
    const linkToken = sessionStorage.getItem(IDENTITY_LINK_TOKEN_KEY);
    if (!linkToken) return false;

    const authenticated = await initializeKeycloak(true);
    const keycloakToken = authenticated
      ? await getKeycloakAccessToken()
      : null;
    if (!keycloakToken) throw new Error('Session Keycloak indisponible.');

    await completeIdentityLink(linkToken, keycloakToken);
    sessionStorage.removeItem(IDENTITY_LINK_TOKEN_KEY);
    await refreshUser();
    return true;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    clearSession();
    if (authMode === 'keycloak') {
      await logoutFromKeycloak(`${window.location.origin}/login`);
    }
  }, [authMode, clearSession]);

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
      authMode,
      isReady,
      linkRequired,
      sessionMessage,
      loginError,
      login,
      loginWithKeycloak,
      registerWithKeycloak,
      linkExistingAccount,
      beginIdentityLink,
      completePendingIdentityLink,
      logout,
      clearSession,
      refreshUser,
      handleSessionError,
    }),
    [
      user,
      token,
      authMode,
      isReady,
      linkRequired,
      sessionMessage,
      loginError,
      login,
      loginWithKeycloak,
      registerWithKeycloak,
      linkExistingAccount,
      beginIdentityLink,
      completePendingIdentityLink,
      logout,
      clearSession,
      refreshUser,
      handleSessionError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
