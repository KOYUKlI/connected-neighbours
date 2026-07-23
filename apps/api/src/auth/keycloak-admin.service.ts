import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AccountSecurityAction } from './dto/request-account-action.dto';

type KeycloakTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
};

type KeycloakUserResponse = {
  enabled?: unknown;
  emailVerified?: unknown;
};

type KeycloakCredentialResponse = {
  type?: unknown;
};

type KeycloakSessionResponse = {
  start?: unknown;
  lastAccess?: unknown;
  rememberMe?: unknown;
  clients?: unknown;
};

const REQUIRED_ACTIONS: Record<AccountSecurityAction, string> = {
  [AccountSecurityAction.VERIFY_EMAIL]: 'VERIFY_EMAIL',
  [AccountSecurityAction.UPDATE_PASSWORD]: 'UPDATE_PASSWORD',
  [AccountSecurityAction.CONFIGURE_TOTP]: 'CONFIGURE_TOTP',
};

export type KeycloakAvailability = 'available' | 'disabled' | 'unavailable';

export type SafeKeycloakSession = {
  startedAt: string | null;
  lastAccessAt: string | null;
  rememberMe: boolean;
  clients: string[];
};

@Injectable()
export class KeycloakAdminService {
  private readonly enabled: boolean;
  private readonly internalUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly timeoutMs: number;
  private serviceToken: { value: string; expiresAt: number } | null = null;
  private serviceTokenRequest: Promise<string> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('KEYCLOAK_ENABLED', false);
    this.internalUrl = this.trimTrailingSlash(
      this.configService.get<string>('KEYCLOAK_INTERNAL_URL', ''),
    );
    this.realm = this.configService.get<string>(
      'KEYCLOAK_REALM',
      'connected-neighbours',
    );
    this.clientId = this.configService.get<string>(
      'KEYCLOAK_SERVICE_CLIENT_ID',
      'connected-neighbours-service',
    );
    this.clientSecret = this.configService.get<string>(
      'KEYCLOAK_SERVICE_CLIENT_SECRET',
      '',
    );
    this.timeoutMs = this.configService.get<number>(
      'KEYCLOAK_REQUEST_TIMEOUT_MS',
      2500,
    );
  }

  availability(): KeycloakAvailability {
    return this.isConfigured() ? 'available' : 'disabled';
  }

  async getUserSecurity(subject: string) {
    this.assertConfigured();
    const [user, credentials, sessions] = await Promise.all([
      this.adminRequest<KeycloakUserResponse>(
        `/users/${encodeURIComponent(subject)}`,
      ),
      this.adminRequest<KeycloakCredentialResponse[]>(
        `/users/${encodeURIComponent(subject)}/credentials`,
      ),
      this.listSessions(subject),
    ]);

    return {
      availability: 'available' as const,
      enabled: user.enabled === true,
      emailVerified: user.emailVerified === true,
      mfaConfigured: credentials.some(
        (credential) => credential.type === 'otp',
      ),
      sessionCount: sessions.length,
      sessions,
    };
  }

  async listSessions(subject: string): Promise<SafeKeycloakSession[]> {
    this.assertConfigured();
    const sessions = await this.adminRequest<KeycloakSessionResponse[]>(
      `/users/${encodeURIComponent(subject)}/sessions`,
    );

    return sessions.map((session) => ({
      startedAt: this.toIsoDate(session.start),
      lastAccessAt: this.toIsoDate(session.lastAccess),
      rememberMe: session.rememberMe === true,
      clients: this.safeClientNames(session.clients),
    }));
  }

  async sendRequiredActionEmail(
    subject: string,
    action: AccountSecurityAction,
  ) {
    this.assertConfigured();
    await this.adminRequest<void>(
      `/users/${encodeURIComponent(subject)}/execute-actions-email`,
      {
        method: 'PUT',
        body: JSON.stringify([REQUIRED_ACTIONS[action]]),
      },
    );
  }

  async logoutAll(subject: string) {
    this.assertConfigured();
    await this.adminRequest<void>(
      `/users/${encodeURIComponent(subject)}/logout`,
      { method: 'POST' },
    );
  }

  private async adminRequest<T>(path: string, init: RequestInit = {}) {
    const token = await this.getServiceToken();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body) headers.set('Content-Type', 'application/json');

    const response = await this.fetchWithTimeout(
      `${this.internalUrl}/admin/realms/${encodeURIComponent(this.realm)}${path}`,
      { ...init, headers },
    );

    if (response.status === 404) {
      throw new NotFoundException('Identité Keycloak introuvable.');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Le service de gestion des identités est momentanément indisponible.',
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async getServiceToken() {
    this.assertConfigured();
    if (
      this.serviceToken &&
      this.serviceToken.expiresAt > Date.now() + 30_000
    ) {
      return this.serviceToken.value;
    }

    this.serviceTokenRequest ??= this.requestServiceToken().finally(() => {
      this.serviceTokenRequest = null;
    });
    return this.serviceTokenRequest;
  }

  private async requestServiceToken() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    const response = await this.fetchWithTimeout(
      `${this.internalUrl}/realms/${encodeURIComponent(this.realm)}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Le service de gestion des identités est momentanément indisponible.',
      );
    }

    const payload = (await response.json()) as KeycloakTokenResponse;
    if (
      typeof payload.access_token !== 'string' ||
      typeof payload.expires_in !== 'number'
    ) {
      throw new ServiceUnavailableException(
        'Réponse invalide du service de gestion des identités.',
      );
    }

    this.serviceToken = {
      value: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };
    return this.serviceToken.value;
  }

  private async fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch {
      throw new ServiceUnavailableException(
        'Le service de gestion des identités est momentanément indisponible.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private isConfigured() {
    return Boolean(
      this.enabled &&
      this.internalUrl &&
      this.realm &&
      this.clientId &&
      this.clientSecret,
    );
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new ConflictException(
        'La gestion Keycloak est désactivée ou incomplètement configurée.',
      );
    }
  }

  private safeClientNames(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    return Object.values(value)
      .filter((client): client is string => typeof client === 'string')
      .map((client) => client.slice(0, 100))
      .sort();
  }

  private toIsoDate(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return new Date(value).toISOString();
  }

  private trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '');
  }
}
