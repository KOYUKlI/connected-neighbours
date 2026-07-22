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
  identityProvider?: 'local' | 'keycloak' | 'linked';
  emailVerified?: boolean;
  identityLinkedAt?: string | null;
  onboardingCompleted?: boolean;
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

type IdentityLinkRequest = {
  linkToken: string;
  expiresAt: string;
};

type IdentityLinkResult = {
  linked: boolean;
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

export function requestIdentityLink(localToken?: string) {
  return apiRequest<IdentityLinkRequest>('/api/auth/identity/link/request', {
    method: 'POST',
    auth: !localToken,
    headers: localToken
      ? { Authorization: `Bearer ${localToken}` }
      : undefined,
  });
}

export function completeIdentityLink(linkToken: string, keycloakToken: string) {
  return apiRequest<IdentityLinkResult>('/api/auth/identity/link/complete', {
    method: 'POST',
    auth: false,
    headers: { Authorization: `Bearer ${keycloakToken}` },
    body: JSON.stringify({ linkToken }),
  });
}