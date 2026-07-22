import { apiRequest } from "./client";
import type {
  PublicUserSummary,
  ServiceItem,
  ServiceStatus,
  ServiceType,
} from "./services";

export type ContractStatus =
  | "draft"
  | "sent"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";

export type ContractServiceSummary = {
  id: string;
  title: string;
  type: ServiceType;
  category: string;
  status: ServiceStatus;
  neighborhoodId: string;
};

export type ContractItem = {
  _id?: string;
  id?: string;
  serviceId: string;
  applicationId?: string | null;
  requesterId: string;
  providerId: string;
  payerId: string;
  receiverId: string;
  pricePoints: number;
  status: ContractStatus;
  signedByIds: string[];
  signedAt?: string | null;
  completedAt?: string | null;
  documentId?: string | null;
  finalizedDocumentFileId?: string | null;
  documentFinalSha256?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requester?: PublicUserSummary | null;
  provider?: PublicUserSummary | null;
  service?: ContractServiceSummary | null;
  review?: {
    canReview: boolean;
    hasReviewed: boolean;
    reviewId: string | null;
    otherPartyId: string | null;
  };
};

export type ContractCreationResult = {
  service: ServiceItem;
  contract: ContractItem;
};

export function createContractFromApplication(applicationId: string) {
  return apiRequest<ContractCreationResult>(
    `/api/contracts/from-application/${applicationId}`,
    {
      method: "POST",
    },
  );
}

export function getContracts() {
  return apiRequest<ContractItem[]>("/api/contracts");
}

export function getContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}`);
}

export function signContract(id: string, signatureText: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}/sign`, {
    method: "POST",
    body: JSON.stringify({ consent: true, signatureText }),
  });
}
export function completeContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}/complete`, {
    method: "POST",
  });
}

export function cancelContract(id: string) {
  return apiRequest<ContractItem>(`/api/contracts/${id}/cancel`, {
    method: "POST",
  });
}
