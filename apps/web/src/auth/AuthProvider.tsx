import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { AuthContext, type AuthContextValue } from './AuthContext';
import { getMe, login as loginRequest } from './api';
import { authStorage } from './storage';
import type { AuthUser, LoginInput } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const token = authStorage.getToken();

      if (!token) {
        setIsReady(true);
        return;
      }

      try {
        const me = await getMe();
        setUser(me);
      } catch {
        authStorage.clearToken();
        setUser(null);
      } finally {
        setIsReady(true);
      }
    }

    void bootstrap();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input);
    authStorage.setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    authStorage.clearToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login,
      logout,
    }),
    [user, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
