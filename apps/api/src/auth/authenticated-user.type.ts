import { Role } from './role.enum';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: Role;
  displayName: string;
  neighborhoodId: string;
};

export type AuthenticatedRequest = {
  user?: AuthenticatedUser;
};
