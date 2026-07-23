import { createContext } from 'react';

import type { PublicUser } from '../api/client';

export type AdminAuthMode = 'local' | 'keycloak';

export type AdminAuthContextValue = {
  token: string | null;
  currentUser: PublicUser | null;
  authMode: AdminAuthMode;
  isReady: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<PublicUser | null>;
  loginWithKeycloak: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: (message?: string) => void;
  handleSessionError: (error: unknown) => boolean;
};

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);