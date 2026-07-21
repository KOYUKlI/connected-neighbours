import { apiRequest } from "./client";
import type { PublicUserSummary } from "./services";

export type DocumentStatus =
  | "draft"
  | "uploaded"
  | "prepared"
  | "sent_for_signature"
  | "partially_signed"
  | "signed"
  | "finalized"
  | "archived"
  | "cancelled";
export type DocumentFieldType =
  | "signature"
  | "initials"
  | "date"
  | "text"
  | "checkbox";
export type DocumentRoleFilter = "owned" | "to-sign" | "completed";
export type DocumentFileVariant = "original" | "current" | "final";

export type DocumentField = {
  id: string;
  type: DocumentFieldType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedToUserId: string;
  required: boolean;
  label?: string | null;
  signedAt?: string | null;
  value?: string | boolean | null;
  signatureId?: string | null;
};

export type DocumentSigner = {
  userId: string;
  status: "pending" | "signed";
  signedAt?: string | null;
  profile?: PublicUserSummary | null;
};

export type DocumentSignature = {
  id: string;
  signerId: string;
  fieldIds: string[];
  signedAt: string;
  sourceSha256: string;
  resultSha256: string;
  documentVersion: number;
  consentVersion: string;
  auditReference: string;
};

export type DocumentAuditEntry = {
  action: string;
  actorId: string;
  at: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type DocumentPermissions = {
  canUploadDocument: boolean;
  canGenerateContractDocument: boolean;
  canPrepareDocument: boolean;
  canSendForSignature: boolean;
  canSign: boolean;
  canDownloadOriginal: boolean;
  canDownloadCurrent: boolean;
  canDownloadFinal: boolean;
  canArchive: boolean;
  canCancel: boolean;
  canViewAudit: boolean;
};

export type DocumentItem = {
  id: string;
  title: string;
  type: "contract" | "imported_document";
  contractId: string;
  serviceId: string;
  ownerId: string;
  status: DocumentStatus;
  pageCount: number;
  fields: DocumentField[];
  signers: DocumentSigner[];
  signatures: DocumentSignature[];
  auditTrail: DocumentAuditEntry[];
  version: number;
  sentForSignatureAt?: string | null;
  finalizedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  hashes: { original: string; current: string; final?: string | null };
  files: {
    original: { id: string; available: boolean };
    current: { id: string; available: boolean };
    final?: { id: string; available: boolean } | null;
  };
  contract?: {
    id: string;
    status: string;
    pricePoints: number;
    requester?: PublicUserSummary | null;
    provider?: PublicUserSummary | null;
  } | null;
  service?: {
    id: string;
    title: string;
    status: string;
    category: string;
  } | null;
  progress: { signed: number; total: number };
  permissions: DocumentPermissions;
};

export type DocumentListResponse = {
  items: DocumentItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function getDocuments(
  input: {
    role?: DocumentRoleFilter;
    status?: DocumentStatus;
    page?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (input.role) query.set("role", input.role);
  if (input.status) query.set("status", input.status);
  query.set("page", String(input.page ?? 1));
  query.set("limit", "30");
  return apiRequest<DocumentListResponse>(`/api/documents?${query}`);
}

export function getDocument(id: string) {
  return apiRequest<DocumentItem>(`/api/documents/${id}`);
}

export function getContractDocument(contractId: string) {
  return apiRequest<DocumentItem | null>(
    `/api/contracts/${contractId}/document`,
  );
}

export function generateContractDocument(contractId: string) {
  return apiRequest<DocumentItem>(
    `/api/contracts/${contractId}/document/generate`,
    { method: "POST" },
  );
}

export async function importContractDocument(
  contractId: string,
  file: File,
  title: string,
) {
  const presigned = await apiRequest<{
    fileId: string;
    uploadUrl: string;
    method: "PUT";
    headers: Record<string, string>;
  }>("/api/storage/presign-upload", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      contextType: "contract_document",
      contextId: contractId,
    }),
  });
  const upload = await fetch(presigned.uploadUrl, {
    method: presigned.method,
    headers: presigned.headers,
    body: file,
  });
  if (!upload.ok)
    throw new Error("Le PDF n’a pas pu être chargé dans le stockage privé.");
  await apiRequest(`/api/storage/files/${presigned.fileId}/complete`, {
    method: "POST",
  });
  return apiRequest<DocumentItem>(`/api/contracts/${contractId}/document`, {
    method: "POST",
    body: JSON.stringify({ fileId: presigned.fileId, title }),
  });
}

export function saveDocumentFields(id: string, fields: DocumentField[]) {
  return apiRequest<DocumentItem>(`/api/documents/${id}/fields`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export function sendDocumentForSignature(id: string) {
  return apiRequest<DocumentItem>(`/api/documents/${id}/send-for-signature`, {
    method: "POST",
  });
}

export function signDocument(
  id: string,
  input: {
    signatureText: string;
    values: Array<{ fieldId: string; value: string | boolean }>;
  },
) {
  return apiRequest<DocumentItem>(`/api/documents/${id}/sign`, {
    method: "POST",
    body: JSON.stringify({ consent: true, ...input }),
  });
}

export function archiveDocument(id: string) {
  return apiRequest<DocumentItem>(`/api/documents/${id}/archive`, {
    method: "POST",
  });
}

export function cancelDocument(id: string) {
  return apiRequest<DocumentItem>(`/api/documents/${id}/cancel`, {
    method: "POST",
  });
}

export function getDocumentDownloadUrl(
  id: string,
  variant: DocumentFileVariant,
  disposition: "inline" | "attachment" = "inline",
) {
  return apiRequest<{ url: string; filename: string; expiresAt: string }>(
    `/api/documents/${id}/download-url?variant=${variant}&disposition=${disposition}`,
  );
}
