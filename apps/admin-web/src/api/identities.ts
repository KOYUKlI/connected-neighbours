import { apiRequest } from "./client";

export type AdminIdentitySummary = {
  id: string;
  email: string;
  displayName: string;
  role: "resident" | "moderator" | "admin";
  isActive: boolean;
  identityProvider: "local" | "keycloak" | "linked";
  identityMigrationStatus: string;
  emailVerified: boolean;
  keycloakLinked: boolean;
  identityLinkedAt: string | null;
  lastIdentitySyncAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminIdentityList = {
  items: AdminIdentitySummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type AdminIdentityDetail = {
  identity: AdminIdentitySummary;
  keycloak: null | {
    availability: "available";
    enabled: boolean;
    emailVerified: boolean;
    mfaConfigured: boolean;
    sessionCount: number;
    sessions: Array<{
      startedAt: string | null;
      lastAccessAt: string | null;
      rememberMe: boolean;
      clients: string[];
    }>;
  };
};

export type AdminIdentityAction =
  | "verify_email"
  | "update_password"
  | "configure_totp";

export function fetchAdminIdentities(search = "") {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  if (search.trim()) query.set("search", search.trim());
  return apiRequest<AdminIdentityList>(`/api/admin/identities?${query}`);
}

export function fetchAdminIdentity(userId: string) {
  return apiRequest<AdminIdentityDetail>(`/api/admin/identities/${userId}`);
}

export function sendAdminIdentityAction(
  userId: string,
  action: AdminIdentityAction,
) {
  return apiRequest<{ sent: true }>(`/api/admin/identities/${userId}/actions`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function revokeAdminIdentitySessions(userId: string, reason: string) {
  return apiRequest<{ revoked: true }>(
    `/api/admin/identities/${userId}/revoke`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}
