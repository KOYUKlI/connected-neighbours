import { apiRequest } from './client';
import type { IncidentItem } from './incidents';
import type { EventItem } from './events';
import type { PublicUserSummary, ServiceItem } from './services';
import type { VoteItem } from './votes';

export type HomeTodoItem = {
  type: 'compare_applications' | 'sign_contract' | 'follow_active_contract';
  serviceId: string;
  serviceTitle: string | null;
  count?: number;
  contractId?: string;
};

export type HomeResponse = {
  profile: PublicUserSummary & {
    neighborhood: {
      id: string;
      name: string;
      city: string;
      postalCode?: string | null;
    } | null;
  };
  points: {
    availablePoints: number;
    reservedPoints: number;
    frozenPoints?: number;
  };
  todoItems: HomeTodoItem[];
  recentServices: ServiceItem[];
  recentIncidents: Array<
    Pick<
      IncidentItem,
      'id' | 'title' | 'type' | 'severity' | 'status' | 'neighborhoodId' | 'createdAt'
    >
  >;
  upcomingEvents: EventItem[];
  openVotes: VoteItem[];
  myUpcomingEventsCount: number;
  myPendingVotesCount: number;
  counts: {
    createdServices: number;
    applications: number;
    contracts: number;
  };
};

export function getHome() {
  return apiRequest<HomeResponse>('/api/home');
}
