import { apiRequest } from "./client";
import {
  uploadProofFile,
  type ProofAttachment,
  type ProofFilePermissions,
  type ProofUploadPhase,
  type SecureDownload,
} from "./proofFiles";

export type PublicUserSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  neighborhoodId: string;
  reputationScore: number | null;
  averageRating: number | null;
  reviewCount: number;
  completedServicesCount: number;
};

export type NeighborhoodSummary = {
  id: string;
  name: string;
  city?: string | null;
};

export type ServiceType = "offer" | "request";

export type ServiceStatus =
  | "draft"
  | "published"
  | "application_received"
  | "candidate_selected"
  | "contract_pending"
  | "awaiting_signatures"
  | "contract_active"
  | "scheduled"
  | "accepted"
  | "in_progress"
  | "awaiting_validation"
  | "correction_requested"
  | "completed"
  | "cancelled"
  | "disputed";

export type ServiceViewer = {
  isOwner: boolean;
  hasApplied: boolean;
  applicationId: string | null;
  applicationStatus: string | null;
  canApply: boolean;
  canManage: boolean;
};

export type ServicePermissions = {
  canEdit: boolean;
  canPublish: boolean;
  canCancel: boolean;
  canApply: boolean;
  canViewApplications: boolean;
  canGenerateContract: boolean;
  canViewContract: boolean;
  canStart: boolean;
  canAddProof: boolean;
  canMarkDone: boolean;
  canValidate: boolean;
  canRequestCorrection: boolean;
  canViewProofs: boolean;
  canOpenDispute: boolean;
  canViewDispute: boolean;
  canAddDisputeEvidence: boolean;
  canAssignDispute: boolean;
  canStartReview: boolean;
  canResolveDispute: boolean;
  canCloseDispute: boolean;
  canReview: boolean;
};

export type ContractSummary = {
  id: string;
  status: string;
  pricePoints: number;
  signaturesCount: number;
  requiredSignaturesCount: number;
};

export type ServiceProofType = "note" | "image" | "document" | "audio";

export type ServiceProof = {
  id: string;
  serviceId: string;
  authorId: string;
  type: ServiceProofType;
  message: string | null;
  fileReference: string | null;
  fileId: string | null;
  attachment: ProofAttachment | null;
  permissions: ProofFilePermissions;
  createdAt?: string;
  author: PublicUserSummary | null;
};

export type ExecutionMutationResult = {
  serviceId: string;
  contractId: string;
  status: ServiceStatus;
  executionStatus: ServiceStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  markedDoneAt: string | null;
  correctionRequestedAt: string | null;
  correctionReason: string | null;
  validatedAt: string | null;
  completedAt: string | null;
  contractStatus: string;
  pointsTransferred: boolean;
  alreadyTransferred: boolean;
};

export type ServiceItem = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  type: ServiceType;
  category: string;
  availability: string;
  neighborhoodId: string;
  ownerId: string;
  isPaid: boolean;
  pricePoints: number | null;
  status: ServiceStatus;
  executionStatus?: ServiceStatus;
  scheduledAt?: string | null;
  startedAt?: string | null;
  markedDoneAt?: string | null;
  validatedAt?: string | null;
  correctionRequestedAt?: string | null;
  correctionReason?: string | null;
  completedAt?: string | null;
  proofsCount?: number;
  nextAction?: string | null;
  selectedApplicationId?: string | null;
  contractId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  neighborhood?: NeighborhoodSummary | null;
  owner?: PublicUserSummary | null;
  applicationsCount?: number;
  viewer?: ServiceViewer;
  permissions?: ServicePermissions;
  contractSummary?: ContractSummary | null;
  activeDispute?: {
    id: string;
    status: "open" | "under_review";
    reservedPoints: number;
  } | null;
  review?: {
    canReview: boolean;
    hasReviewed: boolean;
    reviewId: string | null;
    otherPartyId: string | null;
  } | null;
};

export type InvolvedServiceItem = ServiceItem & {
  involvement: {
    role: "applicant" | "requester" | "provider";
    applicationStatus: string | null;
    contractStatus: string | null;
    nextAction: string | null;
  };
};

export type CreateServiceInput = {
  title: string;
  description: string;
  type: ServiceType;
  category: string;
  availability: string;
  neighborhoodId: string;
  isPaid: boolean;
  pricePoints?: number;
  status?: ServiceStatus;
};

export function getServices() {
  return apiRequest<ServiceItem[]>("/api/services");
}

export function getService(id: string) {
  return apiRequest<ServiceItem>("/api/services/" + id);
}

export function getMyCreatedServices() {
  return apiRequest<ServiceItem[]>("/api/services/me/created");
}

export function getMyInvolvedServices() {
  return apiRequest<InvolvedServiceItem[]>("/api/services/me/involved");
}

export function createService(input: CreateServiceInput) {
  return apiRequest<ServiceItem>("/api/services", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function publishService(id: string) {
  return apiRequest<ServiceItem>("/api/services/" + id + "/publish", {
    method: "POST",
  });
}

export function cancelService(id: string) {
  return apiRequest<ServiceItem>("/api/services/" + id + "/cancel", {
    method: "POST",
  });
}

export function startService(id: string) {
  return apiRequest<ExecutionMutationResult>("/api/services/" + id + "/start", {
    method: "POST",
  });
}

export function getServiceProofs(id: string) {
  return apiRequest<ServiceProof[]>("/api/services/" + id + "/proofs");
}

export function addServiceProof(
  id: string,
  input: {
    message?: string;
    fileId?: string;
  },
) {
  return apiRequest<ServiceProof>("/api/services/" + id + "/proofs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function uploadServiceProofFile(
  id: string,
  file: File,
  onPhase: (phase: ProofUploadPhase, progress?: number) => void,
) {
  return uploadProofFile(
    `/api/services/${id}/proofs/presign-upload`,
    file,
    onPhase,
  );
}

export function getServiceProofDownloadUrl(
  serviceId: string,
  proofId: string,
  disposition: "inline" | "attachment",
) {
  return apiRequest<SecureDownload>(
    `/api/services/${serviceId}/proofs/${proofId}/download-url?disposition=${disposition}`,
  );
}

export function deleteServiceProofAttachment(
  serviceId: string,
  proofId: string,
) {
  return apiRequest<ServiceProof>(
    `/api/services/${serviceId}/proofs/${proofId}/attachment`,
    { method: "DELETE" },
  );
}

export function markServiceDone(id: string) {
  return apiRequest<ExecutionMutationResult>(
    "/api/services/" + id + "/mark-done",
    { method: "POST" },
  );
}

export function validateService(id: string) {
  return apiRequest<ExecutionMutationResult>(
    "/api/services/" + id + "/validate",
    { method: "POST" },
  );
}

export function requestServiceCorrection(id: string, reason: string) {
  return apiRequest<ExecutionMutationResult>(
    "/api/services/" + id + "/request-correction",
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}
