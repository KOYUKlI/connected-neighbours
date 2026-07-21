import { apiRequest } from './client'
import type { PublicUserSummary, ServiceProof } from './services'

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed'
export type DisputeReason =
  | 'service_not_completed'
  | 'service_quality'
  | 'no_show'
  | 'incorrect_description'
  | 'unsafe_behavior'
  | 'payment_disagreement'
  | 'other'
export type DisputeOutcome = 'provider_payment' | 'requester_refund' | 'split' | 'other'
export type DisputeResolutionType = 'provider_payment' | 'requester_refund' | 'split'

export type DisputeEvidence = {
  id: string
  disputeId: string
  type: 'note' | 'image' | 'document' | 'audio'
  message: string | null
  fileReference: string | null
  createdAt?: string
  author: PublicUserSummary | null
}

export type DisputeResolution = {
  type: DisputeResolutionType
  justification: string
  providerPoints: number
  requesterPoints: number
  resolvedById: string
  resolvedAt: string
}

export type DisputeSummary = {
  id: string
  serviceId: string
  contractId: string
  reason: DisputeReason
  requestedOutcome: DisputeOutcome | null
  status: DisputeStatus
  reservedPoints: number
  openedAt: string
  resolvedAt: string | null
  updatedAt?: string
  service: {
    id: string
    title: string
    status: string
    neighborhoodId: string
  } | null
  requester: PublicUserSummary | null
  provider: PublicUserSummary | null
  openedBy: PublicUserSummary | null
  assignedModerator: PublicUserSummary | null
  nextAction: string | null
}

export type DisputeDetail = DisputeSummary & {
  openedById: string
  description: string
  assignedModeratorId: string | null
  previousServiceStatus: string
  assignedAt: string | null
  reviewStartedAt: string | null
  closedAt: string | null
  createdAt?: string
  resolution: DisputeResolution | null
  contract: {
    id: string
    status: string
    pricePoints: number
  }
  service: NonNullable<DisputeSummary['service']>
  evidence: DisputeEvidence[]
  serviceProofs: ServiceProof[]
  history: Array<{
    type: string
    occurredAt: string
    metadata: Record<string, string | number | boolean | null>
    actor: PublicUserSummary | null
  }>
  permissions: {
    canViewDispute: boolean
    canAddDisputeEvidence: boolean
    canAssignDispute: boolean
    canStartReview: boolean
    canResolveDispute: boolean
    canCloseDispute: boolean
  }
}

export type OpenDisputeInput = {
  reason: DisputeReason
  description: string
  requestedOutcome?: DisputeOutcome
}

export function openServiceDispute(serviceId: string, input: OpenDisputeInput) {
  return apiRequest<DisputeDetail>('/api/services/' + serviceId + '/disputes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getMyDisputes() {
  return apiRequest<DisputeSummary[]>('/api/disputes/me')
}

export function getDispute(id: string) {
  return apiRequest<DisputeDetail>('/api/disputes/' + id)
}

export function addDisputeEvidence(id: string, message: string) {
  return apiRequest<DisputeEvidence>('/api/disputes/' + id + '/evidence', {
    method: 'POST',
    body: JSON.stringify({ type: 'note', message }),
  })
}
