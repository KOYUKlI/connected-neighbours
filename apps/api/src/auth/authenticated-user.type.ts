import type { AuthenticatedIdentity } from './authenticated-identity.type';
import { Role } from './role.enum';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: Role;
  displayName: string;
  neighborhoodId: string;
  identity?: AuthenticatedIdentity;
};

export type AuthenticatedRequest = {
  user?: AuthenticatedUser;
};
