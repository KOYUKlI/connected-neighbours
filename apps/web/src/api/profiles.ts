import { apiRequest } from './client';
import type { ReputationSummary, ReviewPage } from './reviews';

export type ProfileVisibility = 'neighborhood' | 'private';

export type OwnProfile = {
  id: string;
  email: string;
  displayName: string;
  neighborhoodId: string;
  neighborhood: { id: string; name: string; city: string } | null;
  avatarUrl: string | null;
  bio: string;
  interests: string[];
  profileVisibility: ProfileVisibility;
  showNeighborhood: boolean;
  showReviews: boolean;
  showCompletedServices: boolean;
  showReputation: boolean;
  profileUpdatedAt: string | null;
  reputation: ReputationSummary;
};

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isRestricted: boolean;
  bio?: string;
  interests?: string[];
  neighborhoodId?: string | null;
  neighborhood?: { id: string; name: string; city: string } | null;
  profileVisibility?: ProfileVisibility;
  reputation?: ReputationSummary | null;
  completedServicesCount?: number | null;
  recentServices?: Array<{
    id: string;
    title: string;
    category: string;
    type: string;
    status: string;
  }>;
  reviews?: ReviewPage | null;
  permissions: { canEdit: boolean };
};

export type UpdateProfileInput = Pick<
  OwnProfile,
  | 'displayName'
  | 'bio'
  | 'interests'
  | 'profileVisibility'
  | 'showNeighborhood'
  | 'showReviews'
  | 'showCompletedServices'
  | 'showReputation'
>;

type PresignedUpload = {
  fileId: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
};

export function getMyProfile() {
  return apiRequest<OwnProfile>('/api/users/me/profile');
}

export function updateMyProfile(input: UpdateProfileInput) {
  return apiRequest<OwnProfile>('/api/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getPublicProfile(userId: string) {
  return apiRequest<PublicProfile>(`/api/users/${userId}/public`);
}

export async function uploadAvatar(file: File) {
  const presigned = await apiRequest<PresignedUpload>(
    '/api/users/me/avatar/presign',
    {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    },
  );
  const upload = await fetch(presigned.uploadUrl, {
    method: presigned.method,
    headers: presigned.headers,
    body: file,
  });
  if (!upload.ok) throw new Error('Le transfert de l’avatar a échoué.');
  return apiRequest<OwnProfile>(
    `/api/users/me/avatar/${presigned.fileId}/complete`,
    { method: 'POST' },
  );
}

export function deleteAvatar() {
  return apiRequest<OwnProfile>('/api/users/me/avatar', {
    method: 'DELETE',
  });
}
