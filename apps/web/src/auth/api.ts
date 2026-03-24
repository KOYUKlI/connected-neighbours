import { apiFetch } from '../lib/http';
import type { AuthUser, LoginInput, LoginResponse } from './types';

export function login(input: LoginInput) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMe() {
  return apiFetch<AuthUser>('/auth/me');
}