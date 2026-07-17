import { apiRequest } from './client';

export type UserRole = 'resident' | 'moderator' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  neighborhoodId?: string;
  isActive?: boolean;
  pointsBalance?: number;
  reservedPoints?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export function login(input: LoginInput) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input),
  });
}

export function getMe() {
  return apiRequest<AuthUser>('/api/auth/me');
}

export function getNeighbours() {
  return apiRequest<AuthUser[]>('/api/auth/neighbours');
}
