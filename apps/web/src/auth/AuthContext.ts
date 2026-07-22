import { createContext } from 'react';

import type { AuthUser, LoginInput } from '../api/auth';

export type AuthMode = 'local' | 'keycloak';

export type AuthContextValue = {
  user: AuthUser | null;
  currentUser: AuthUser | null;
  token: string | null;
  authMode: AuthMode;
  isReady: boolean;
  linkRequired: boolean;
  sessionMessage: string | null;
  loginError: string | null;
  login: (input: LoginInput, persistent?: boolean) => Promise<void>;
  loginWithKeycloak: (returnTo?: string) => Promise<void>;
  registerWithKeycloak: () => Promise<void>;
  linkExistingAccount: (input: LoginInput) => Promise<void>;
  beginIdentityLink: () => Promise<void>;
  completePendingIdentityLink: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearSession: (message?: string) => void;
  refreshUser: () => Promise<void>;
  handleSessionError: (error: unknown) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);