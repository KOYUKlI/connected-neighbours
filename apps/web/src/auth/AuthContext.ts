import { createContext } from 'react';

import type { AuthUser, LoginInput } from '../api/auth';

export type AuthContextValue = {
  user: AuthUser | null;
  currentUser: AuthUser | null;
  token: string | null;
  isReady: boolean;
  sessionMessage: string | null;
  loginError: string | null;
  login: (input: LoginInput, persistent?: boolean) => Promise<void>;
  logout: () => void;
  clearSession: (message?: string) => void;
  refreshUser: () => Promise<void>;
  handleSessionError: (error: unknown) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);