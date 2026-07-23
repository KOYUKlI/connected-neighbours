import { apiRequest } from './client'

export type AdminReviewStatus = 'published' | 'hidden'

export type AdminReview = {
  id: string
  contractId: string
  serviceId: string
  rating: number
  comment: string
  status: AdminReviewStatus
  response: { message: string; respondedAt: string } | null
  moderationReason: string | null
  moderationHistory: Array<{
    action: 'hidden' | 'restored'
    moderatorId: string
    reason: string
    createdAt: string
  }>
  createdAt?: string
  author: { id: string; displayName: string; avatarUrl: string | null } | null
  targetUser: { id: string; displayName: string; avatarUrl: string | null } | null
  service: { id: string; title: string; category: string; status: string } | null
}

export type AdminReviewPage = {
  items: AdminReview[]
  page: number
  limit: number
  total: number
}

export function fetchAdminReviews() {
  return apiRequest<AdminReviewPage>('/api/admin/reviews?limit=100')
}

export function fetchAdminReview(id: string) {
  return apiRequest<AdminReview>(`/api/admin/reviews/${id}`)
}

export function hideAdminReview(id: string, reason: string) {
  return apiRequest<AdminReview>(`/api/admin/reviews/${id}/hide`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function restoreAdminReview(id: string, reason: string) {
  return apiRequest<AdminReview>(`/api/admin/reviews/${id}/restore`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
