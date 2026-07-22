import { apiRequest } from './client';

export type SecuritySummary = {
  identityProvider: 'local' | 'keycloak' | 'linked';
  emailVerified: boolean;
  identityLinked: boolean;
  identityLinkedAt: string | null;
  onboardingCompleted: boolean;
  keycloakEnabled: boolean;
  accountConsoleUrl: string | null;
  session: {
    provider: 'local' | 'keycloak';
    mfaSatisfied: boolean;
    authenticationMethods: string[];
    expiresAt: string | null;
  };
};

export type SecurityEvent = {
  id: string;
  eventType: string;
  provider: string;
  result: string;
  occurredAt: string;
};

export function getSecuritySummary() {
  return apiRequest<SecuritySummary>('/api/auth/security');
}

export function getSecurityEvents() {
  return apiRequest<SecurityEvent[]>('/api/auth/security/events');
}