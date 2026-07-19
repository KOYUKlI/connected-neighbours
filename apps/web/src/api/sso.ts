import { apiRequest } from './client';

export type AuthorizeSsoInput = {
  callbackUrl: string;
  codeChallenge: string;
};

export type AuthorizeSsoResponse = {
  code: string;
};

export function authorizeSso(input: AuthorizeSsoInput) {
  return apiRequest<AuthorizeSsoResponse>('/api/auth/sso/authorize', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
