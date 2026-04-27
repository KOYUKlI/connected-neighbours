export type ServiceType = 'offer' | 'request';

export type ServiceStatus =
  | 'published'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceItem {
  _id: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceInput {
  title: string;
  description: string;
  type: ServiceType;
  category: string;
  availability: string;
  neighborhoodId: string;
  isPaid: boolean;
  pricePoints?: number;
}

export type ContractStatus = 'sent' | 'active' | 'completed' | 'cancelled';

export interface ContractItem {
  _id: string;
  serviceId: string;
  requesterId: string;
  providerId: string;
  payerId: string;
  receiverId: string;
  pricePoints: number;
  status: ContractStatus;
  signedByIds: string[];
  signedAt: string | null;
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcceptServiceResult {
  service: ServiceItem;
  contract: ContractItem | null;
}

export type PointTransactionType = 'reservation' | 'release' | 'transfer';

export interface PointTransactionItem {
  _id: string;
  type: PointTransactionType;
  amount: number;
  serviceId: string;
  contractId: string;
  fromUserId: string;
  toUserId: string | null;
  createdAt?: string;
}
