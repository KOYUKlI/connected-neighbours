import { apiRequest } from './client';

export type EventStatus = 'draft' | 'published' | 'open_registration' | 'full' | 'started' | 'completed' | 'cancelled' | 'archived';
export type EventResponseStatus = 'interested' | 'going' | 'maybe' | 'not_interested' | 'cancelled' | 'waitlisted';
export type EventCategory = 'workshop' | 'party' | 'fundraising' | 'sport' | 'community_meeting' | 'children' | 'culture' | 'help' | 'emergency' | 'other';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  effectiveStatus: EventStatus;
  startsAt: string;
  endsAt: string;
  registrationDeadline?: string | null;
  locationLabel: string;
  createdAt?: string;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  cancellationReason?: string | null;
  capacity?: number | null;
  organizer: { id: string; displayName: string; avatarUrl?: string | null } | null;
  neighborhood: { id: string; name: string; city?: string | null } | null;
  counts: { interested: number; participants: number; maybe: number; waitlisted: number; remainingPlaces: number | null };
  viewerResponse: { id: string; response: EventResponseStatus; waitlistPosition?: number | null } | null;
  registrationClosed: boolean;
  isFull: boolean;
  nextAction: string | null;
  permissions: {
    canEdit: boolean;
    canPublish: boolean;
    canCancel: boolean;
    canRespond: boolean;
    canJoin: boolean;
    canLeave: boolean;
    canViewParticipants: boolean;
    canComplete: boolean;
    canArchive: boolean;
  };
};

export type EventParticipant = {
  id: string;
  response: EventResponseStatus;
  waitlistPosition?: number | null;
  user: { id: string; displayName: string; avatarUrl?: string | null } | null;
};

export type EventPage = { items: EventItem[]; page: number; limit: number; total: number; totalPages: number };
export type EventInput = {
  title: string;
  description: string;
  category: EventCategory;
  neighborhoodId: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline?: string;
  locationLabel: string;
  capacity?: number;
  minimumAge?: number;
  accessibilityInformation?: string;
  equipmentInformation?: string;
  contactInstructions?: string;
};

function queryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function getEvents(query: Record<string, string | number | undefined> = {}) {
  return apiRequest<EventPage>(`/api/events${queryString({ page: 1, limit: 20, ...query })}`);
}

export function getEvent(id: string) {
  return apiRequest<EventItem>(`/api/events/${id}`);
}

export function getDiscoverEvents(category?: string) {
  return apiRequest<{ recommendationSource: 'neighborhood_fallback'; items: EventItem[] }>(`/api/events/discover${queryString({ category })}`);
}

export function createEvent(input: EventInput) {
  return apiRequest<EventItem>('/api/events', { method: 'POST', body: JSON.stringify(input) });
}

export function updateEvent(id: string, input: Partial<EventInput>) {
  return apiRequest<EventItem>(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function publishEvent(id: string) {
  return apiRequest<EventItem>(`/api/events/${id}/publish`, { method: 'POST' });
}

export function respondToEvent(id: string, response: EventResponseStatus) {
  return apiRequest<{ event: EventItem }>(`/api/events/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) });
}

export function cancelEvent(id: string, reason: string) {
  return apiRequest<EventItem>(`/api/events/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function completeEvent(id: string) {
  return apiRequest<EventItem>(`/api/events/${id}/complete`, { method: 'POST' });
}

export function getEventParticipants(id: string) {
  return apiRequest<EventParticipant[]>(`/api/events/${id}/participants`);
}
