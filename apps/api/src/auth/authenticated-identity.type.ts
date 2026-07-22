import { Role } from './role.enum';

export enum AuthenticationProvider {
  LOCAL = 'local',
  KEYCLOAK = 'keycloak',
}

export type AuthenticatedIdentity = {
  provider: AuthenticationProvider;
  internalUserId: string;
  externalSubject?: string;
  email?: string;
  emailVerified: boolean;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
  sessionId?: string;
  authenticationMethods: string[];
  mfaSatisfied: boolean;
  role: Role;
  neighborhoodId: string;
  displayName: string;
};
