import { apiRequest } from './client';

export type PointBalance = {
  userId: string;
  pointsBalance: number;
  reservedPoints: number;
  availablePoints: number;
};

export type PointTransactionType = 'reservation' | 'release' | 'transfer';

export type PointTransaction = {
  _id?: string;
  id?: string;
  type: PointTransactionType;
  amount: number;
  serviceId: string;
  contractId: string;
  fromUserId: string;
  toUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function getPointBalance() {
  return apiRequest<PointBalance>('/api/points/balance');
}

export function getPointTransactions() {
  return apiRequest<PointTransaction[]>('/api/points/transactions');
}
