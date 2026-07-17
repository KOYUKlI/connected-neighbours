import { createContext } from 'react';

import type { AuthUser } from '../api/auth';

export type AuthContextValue = {
  token: string | null;
  currentUser: AuthUser | null;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  clearSession: (message?: string) => void;
  handleSessionError: (error: unknown) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
