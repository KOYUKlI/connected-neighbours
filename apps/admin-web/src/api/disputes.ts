import { apiRequest } from "./client";

export type AdminDisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "closed";
export type AdminDisputeReason =
  | "service_not_completed"
  | "service_quality"
  | "no_show"
  | "incorrect_description"
  | "unsafe_behavior"
  | "payment_disagreement"
  | "other";
export type AdminDisputeResolutionType =
  | "provider_payment"
  | "requester_refund"
  | "split";

export type AdminProofAttachment = {
  fileId: string;
  fileKind: "image" | "document" | "audio";
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  deleted: boolean;
  deletedAt: string | null;
};

export type AdminProofPermissions = {
  canPreview: boolean;
  canDownload: boolean;
  canDelete: boolean;
};

export type AdminSecureDownload = {
  url: string;
  expiresAt: string;
  filename: string;
  disposition: "inline" | "attachment";
};

export type AdminPublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  neighborhoodId: string;
};

export type AdminDisputeSummary = {
  id: string;
  serviceId: string;
  contractId: string;
  reason: AdminDisputeReason;
  requestedOutcome: string | null;
  status: AdminDisputeStatus;
  reservedPoints: number;
  openedAt: string;
  resolvedAt: string | null;
  updatedAt?: string;
  service: {
    id: string;
    title: string;
    status: string;
    neighborhoodId: string;
  } | null;
  requester: AdminPublicProfile | null;
  provider: AdminPublicProfile | null;
  openedBy: AdminPublicProfile | null;
  assignedModerator: AdminPublicProfile | null;
  nextAction: string | null;
};

export type AdminDisputeDetail = AdminDisputeSummary & {
  description: string;
  previousServiceStatus: string;
  assignedAt: string | null;
  reviewStartedAt: string | null;
  closedAt: string | null;
  contract: {
    id: string;
    status: string;
    pricePoints: number;
  };
  service: NonNullable<AdminDisputeSummary["service"]>;
  evidence: Array<{
    id: string;
    type: string;
    message: string | null;
    fileReference: string | null;
    fileId: string | null;
    attachment: AdminProofAttachment | null;
    permissions: AdminProofPermissions;
    createdAt?: string;
    author: AdminPublicProfile | null;
  }>;
  serviceProofs: Array<{
    id: string;
    type: string;
    message: string | null;
    fileReference: string | null;
    fileId: string | null;
    attachment: AdminProofAttachment | null;
    permissions: AdminProofPermissions;
    createdAt?: string;
    author: AdminPublicProfile | null;
  }>;
  history: Array<{
    type: string;
    occurredAt: string;
    metadata: Record<string, string | number | boolean | null>;
    actor: AdminPublicProfile | null;
  }>;
  resolution: {
    type: AdminDisputeResolutionType;
    justification: string;
    providerPoints: number;
    requesterPoints: number;
    resolvedAt: string;
  } | null;
  permissions: {
    canAssignDispute: boolean;
    canStartReview: boolean;
    canResolveDispute: boolean;
    canCloseDispute: boolean;
  };
};

export type AdminDisputesResponse = {
  items: AdminDisputeSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function fetchAdminDisputes() {
  return apiRequest<AdminDisputesResponse>("/api/admin/disputes?limit=100");
}

export function fetchAdminDispute(id: string) {
  return apiRequest<AdminDisputeDetail>("/api/admin/disputes/" + id);
}

export function assignAdminDispute(id: string, moderatorId?: string) {
  return apiRequest<AdminDisputeDetail>(
    "/api/admin/disputes/" + id + "/assign",
    {
      method: "POST",
      body: JSON.stringify(moderatorId ? { moderatorId } : {}),
    },
  );
}

export function startAdminDisputeReview(id: string) {
  return apiRequest<AdminDisputeDetail>(
    "/api/admin/disputes/" + id + "/start-review",
    {
      method: "POST",
    },
  );
}

export function resolveAdminDispute(
  id: string,
  input: {
    type: AdminDisputeResolutionType;
    justification: string;
    providerPoints?: number;
    requesterPoints?: number;
  },
) {
  return apiRequest<AdminDisputeDetail>(
    "/api/admin/disputes/" + id + "/resolve",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function closeAdminDispute(id: string) {
  return apiRequest<AdminDisputeDetail>(
    "/api/admin/disputes/" + id + "/close",
    {
      method: "POST",
    },
  );
}

export function fetchAdminDisputeEvidenceDownload(
  disputeId: string,
  evidenceId: string,
  disposition: "inline" | "attachment",
) {
  return apiRequest<AdminSecureDownload>(
    `/api/disputes/${disputeId}/evidence/${evidenceId}/download-url?disposition=${disposition}`,
  );
}

export function fetchAdminServiceProofDownload(
  serviceId: string,
  proofId: string,
  disposition: "inline" | "attachment",
) {
  return apiRequest<AdminSecureDownload>(
    `/api/services/${serviceId}/proofs/${proofId}/download-url?disposition=${disposition}`,
  );
}
