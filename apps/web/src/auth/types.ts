export type Role = 'resident' | 'moderator' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  neighborhoodId: string;
  isActive: boolean;
  pointsBalance: number;
  reservedPoints: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
