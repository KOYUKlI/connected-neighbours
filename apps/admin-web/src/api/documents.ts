import { apiRequest } from "./client";

export type AdminDocumentStatus =
  | "draft"
  | "uploaded"
  | "prepared"
  | "sent_for_signature"
  | "partially_signed"
  | "signed"
  | "finalized"
  | "archived"
  | "cancelled";
export type AdminDocument = {
  id: string;
  title: string;
  type: "contract" | "imported_document";
  contractId: string;
  serviceId: string;
  status: AdminDocumentStatus;
  pageCount: number;
  fields: Array<{
    id: string;
    type: string;
    pageNumber: number;
    assignedToUserId: string;
    required: boolean;
    label?: string | null;
    signedAt?: string | null;
  }>;
  signers: Array<{
    userId: string;
    status: "pending" | "signed";
    signedAt?: string | null;
    profile?: { id: string; displayName: string } | null;
  }>;
  signatures: Array<{
    id: string;
    signerId: string;
    signedAt: string;
    auditReference: string;
    sourceSha256: string;
    resultSha256: string;
  }>;
  auditTrail: Array<{
    action: string;
    actorId: string;
    at: string;
    metadata?: Record<string, string | number | boolean | null>;
  }>;
  version: number;
  createdAt?: string;
  finalizedAt?: string | null;
  archivedAt?: string | null;
  hashes: { original: string; current: string; final?: string | null };
  files: {
    original: { id: string };
    current: { id: string };
    final?: { id: string } | null;
  };
  progress: { signed: number; total: number };
  contract?: {
    id: string;
    status: string;
    pricePoints: number;
    requester?: { id: string; displayName: string } | null;
    provider?: { id: string; displayName: string } | null;
  } | null;
  service?: {
    id: string;
    title: string;
    status: string;
    category: string;
  } | null;
  permissions: {
    canArchive: boolean;
    canCancel: boolean;
    canDownloadOriginal: boolean;
    canDownloadCurrent: boolean;
    canDownloadFinal: boolean;
    canViewAudit: boolean;
  };
};

export function fetchAdminDocuments() {
  return apiRequest<{ items: AdminDocument[]; total: number }>(
    "/api/documents?limit=100&page=1",
  );
}
export function fetchAdminDocument(id: string) {
  return apiRequest<AdminDocument>(`/api/documents/${id}`);
}
export function archiveAdminDocument(id: string) {
  return apiRequest<AdminDocument>(`/api/documents/${id}/archive`, {
    method: "POST",
  });
}
export function cancelAdminDocument(id: string) {
  return apiRequest<AdminDocument>(`/api/documents/${id}/cancel`, {
    method: "POST",
  });
}
export function fetchAdminDocumentDownload(
  id: string,
  variant: "original" | "current" | "final",
  disposition: "inline" | "attachment" = "inline",
) {
  return apiRequest<{ url: string; filename: string; expiresAt: string }>(
    `/api/documents/${id}/download-url?variant=${variant}&disposition=${disposition}`,
  );
}
