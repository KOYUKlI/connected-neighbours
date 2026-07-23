import { apiRequest } from './client'

export type PublicProfile = {
  id: string
  displayName: string
  avatarUrl?: string | null
}

export type NeighborhoodSummary = {
  id: string
  name: string
  city?: string
}

export type AdminEventStatus =
  | 'draft'
  | 'published'
  | 'open_registration'
  | 'full'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type AdminEvent = {
  id: string
  title: string
  description: string
  category: string
  status: AdminEventStatus
  effectiveStatus: AdminEventStatus
  startsAt: string
  endsAt: string
  registrationDeadline?: string | null
  locationLabel: string
  capacity?: number | null
  organizer?: PublicProfile | null
  neighborhood?: NeighborhoodSummary | null
  cancellationReason?: string | null
  counts: {
    interested: number
    participants: number
    maybe: number
    waitlisted: number
    remainingPlaces: number | null
  }
  permissions: {
    canCancel: boolean
    canArchive: boolean
    canViewParticipants: boolean
  }
  history?: Array<{
    type: string
    occurredAt: string
    metadata?: Record<string, unknown>
  }>
}

export type AdminEventParticipant = {
  id: string
  response: 'going' | 'waitlisted'
  respondedAt?: string
  waitlistPosition?: number | null
  user?: PublicProfile | null
}

export type AdminVoteStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'cancelled'
  | 'archived'

export type AdminVote = {
  id: string
  title: string
  description: string
  ballotType: 'yes_no' | 'single_choice' | 'multiple_choice' | 'ranking'
  privacy: 'anonymous' | 'public'
  resultsVisibility: 'always' | 'after_submission' | 'after_close'
  status: AdminVoteStatus
  storedStatus: AdminVoteStatus
  opensAt: string
  closesAt: string
  options: Array<{ id: string; label: string; description?: string | null; order: number }>
  answersCount: number
  creator?: PublicProfile | null
  neighborhood?: NeighborhoodSummary | null
  results?: AdminVoteResults | null
  permissions: {
    canEdit: boolean
    canOpen: boolean
    canClose: boolean
    canCancel: boolean
    canArchive: boolean
  }
  history?: Array<{
    type: string
    occurredAt: string
    metadata?: Record<string, unknown>
  }>
}

export type AdminVoteResults = {
  totalAnswers: number
  results: Array<{
    option: { id: string; label: string; order: number }
    count: number
    percentage: number
    percentageDenominator: 'respondents'
    bordaScore: number | null
  }>
  rankingPolicy?: {
    method: 'borda'
    completeRankingRequired: true
    pointsPerRank: 'N - rank'
    unrankedOptions: 'not_allowed'
    tieBreak: 'option_order'
  } | null
  privacy: 'anonymous' | 'public'
  anonymity: 'application_level' | 'public_ballot'
}

type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  pageCount: number
}

export type CreateAdminVoteInput = {
  title: string
  description?: string
  neighborhoodId: string
  ballotType: AdminVote['ballotType']
  privacy: AdminVote['privacy']
  resultsVisibility: AdminVote['resultsVisibility']
  options: Array<{ label: string }>
  allowAnswerChange: boolean
  opensAt?: string
  closesAt: string
  status: 'draft' | 'scheduled'
}

export function fetchAdminEvents() {
  return apiRequest<Paginated<AdminEvent>>('/api/admin/events?limit=100&sort=soonest')
}

export function fetchAdminEvent(id: string) {
  return apiRequest<AdminEvent>(`/api/admin/events/${id}`)
}

export function fetchAdminEventParticipants(id: string) {
  return apiRequest<AdminEventParticipant[]>(`/api/admin/events/${id}/participants`)
}

export function cancelAdminEvent(id: string, reason: string) {
  return apiRequest<AdminEvent>(`/api/admin/events/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function archiveAdminEvent(id: string) {
  return apiRequest<AdminEvent>(`/api/admin/events/${id}/archive`, { method: 'POST' })
}

export function fetchAdminVotes() {
  return apiRequest<Paginated<AdminVote>>('/api/admin/votes?limit=100&sort=newest')
}

export function fetchAdminVote(id: string) {
  return apiRequest<AdminVote>(`/api/admin/votes/${id}`)
}

export function fetchAdminVoteResults(id: string) {
  return apiRequest<AdminVoteResults>(`/api/admin/votes/${id}/results`)
}

export function createAdminVote(input: CreateAdminVoteInput) {
  return apiRequest<AdminVote>('/api/admin/votes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function openAdminVote(id: string) {
  return apiRequest<AdminVote>(`/api/admin/votes/${id}/open`, { method: 'POST' })
}

export function closeAdminVote(id: string) {
  return apiRequest<AdminVote>(`/api/admin/votes/${id}/close`, { method: 'POST' })
}

export function cancelAdminVote(id: string, reason: string) {
  return apiRequest<AdminVote>(`/api/admin/votes/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function archiveAdminVote(id: string) {
  return apiRequest<AdminVote>(`/api/admin/votes/${id}/archive`, { method: 'POST' })
}
