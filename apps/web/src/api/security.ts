import { apiRequest } from "./client";

export type KeycloakAvailability = "available" | "disabled" | "unavailable";

export type SecuritySummary = {
  identityProvider: "local" | "keycloak" | "linked";
  emailVerified: boolean;
  identityLinked: boolean;
  identityLinkedAt: string | null;
  onboardingCompleted: boolean;
  keycloakEnabled: boolean;
  keycloakAvailability: KeycloakAvailability;
  mfaConfigured: boolean | null;
  sessionCount: number | null;
  accountConsoleUrl: string | null;
  session: {
    provider: "local" | "keycloak";
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

export type SecuritySession = {
  startedAt: string | null;
  lastAccessAt: string | null;
  rememberMe: boolean;
  clients: string[];
};

export type AccountSecurityAction =
  | "verify_email"
  | "update_password"
  | "configure_totp";

export function getSecuritySummary() {
  return apiRequest<SecuritySummary>("/api/auth/security");
}

export function getSecurityEvents() {
  return apiRequest<SecurityEvent[]>("/api/auth/security/events");
}

export function getSecuritySessions() {
  return apiRequest<SecuritySession[]>("/api/auth/security/sessions");
}

export function requestSecurityAction(action: AccountSecurityAction) {
  return apiRequest<{ sent: true }>("/api/auth/security/actions", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function revokeAllSecuritySessions() {
  return apiRequest<{ revoked: true }>("/api/auth/security/logout-all", {
    method: "POST",
  });
}

export function recordSecurityLogout() {
  return apiRequest<void>("/api/auth/security/logout", { method: "POST" });
}
