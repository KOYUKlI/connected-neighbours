import { apiRequest } from './client';
import type { PublicUserSummary } from './services';

export type ReputationSummary = {
  averageRating: number | null;
  reviewCount: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  completedServicesCount: number;
  reputationScore: number | null;
  calculatedAt: string;
};

export type ReviewItem = {
  id: string;
  contractId: string;
  serviceId: string;
  rating: number;
  comment: string;
  status: 'published' | 'hidden';
  response: {
    authorId: string;
    message: string;
    respondedAt: string;
  } | null;
  moderationReason?: string | null;
  createdAt?: string;
  author: Pick<PublicUserSummary, 'id' | 'displayName' | 'avatarUrl'> | null;
  targetUser: Pick<PublicUserSummary, 'id' | 'displayName' | 'avatarUrl'> | null;
  service: {
    id: string;
    title: string;
    category: string;
    status: string;
  } | null;
  permissions: {
    canReply: boolean;
    canModerate: boolean;
  };
};

export type ReviewPage = {
  items: ReviewItem[];
  page: number;
  limit: number;
  total: number;
};

export function createReview(
  contractId: string,
  input: { rating: number; comment: string },
) {
  return apiRequest<ReviewItem>(`/api/contracts/${contractId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getUserReviews(userId: string) {
  return apiRequest<ReviewPage>(`/api/users/${userId}/reviews?limit=20`);
}

export function getMyReviews(direction: 'given' | 'received') {
  return apiRequest<ReviewPage>(`/api/reviews/me/${direction}?limit=50`);
}

export function replyToReview(reviewId: string, message: string) {
  return apiRequest<ReviewItem>(`/api/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
