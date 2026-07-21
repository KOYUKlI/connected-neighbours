import { ServiceApplicationStatus } from '../applications/schemas/service-application.schema';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { PublicUserDto } from '../users/dto/public-user.dto';
import { ServiceStatus, ServiceType } from './schemas/service.schema';

export type NeighborhoodSummary = { id: string; name: string; city: string };

export type ServiceResponse = {
  id: string;
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
  selectedApplicationId: string | null;
  contractId: string | null;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  neighborhood: NeighborhoodSummary | null;
  owner: PublicUserDto | null;
  applicationsCount: number;
  viewer: {
    isOwner: boolean;
    hasApplied: boolean;
    applicationId: string | null;
    applicationStatus: ServiceApplicationStatus | null;
    canApply: boolean;
    canManage: boolean;
  };
  permissions: {
    canEdit: boolean;
    canPublish: boolean;
    canCancel: boolean;
    canApply: boolean;
    canViewApplications: boolean;
    canGenerateContract: boolean;
    canViewContract: boolean;
  };
  contractSummary: {
    id: string;
    status: ContractStatus;
    pricePoints: number;
    signaturesCount: number;
    requiredSignaturesCount: number;
  } | null;
};
