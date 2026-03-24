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
  ownerId: string;
  isPaid: boolean;
  pricePoints?: number;
}