import { createContext } from 'react';
import type { AuthUser, LoginInput } from './types';

export type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
