import { createContext } from 'react';

import type { PublicUser } from '../api/client';

export type AdminAuthContextValue = {
  token: string | null;
  currentUser: PublicUser | null;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  clearSession: (message?: string) => void;
  handleSessionError: (error: unknown) => boolean;
};

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);
