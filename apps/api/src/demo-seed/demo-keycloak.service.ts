import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DemoIdentity,
  DEMO_IDENTITIES,
  usesKeycloak,
} from './demo-seed.manifest';

type KeycloakTokenResponse = {
  access_token?: unknown;
};

type KeycloakUser = {
  id?: unknown;
  username?: unknown;
  email?: unknown;
  emailVerified?: unknown;
  enabled?: unknown;
  requiredActions?: unknown;
  credentials?: unknown;
};

type KeycloakCredential = {
  type?: unknown;
};

export type DemoKeycloakIdentity = {
  seedKey: string;
  subject: string;
  emailVerified: boolean;
  enabled: boolean;
  mfaConfigured: boolean;
  requiredActions: string[];
};

@Injectable()
export class DemoKeycloakService {
  private readonly enabled: boolean;
  private readonly internalUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly timeoutMs: number;
  private token: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('KEYCLOAK_ENABLED', false);
    this.internalUrl = this.trim(
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

  get isEnabled() {
    return this.enabled;
  }

  async synchronize(
    passwords: ReadonlyMap<string, string>,
  ): Promise<DemoKeycloakIdentity[]> {
    if (!this.enabled) return [];
    this.assertConfigured();
    this.assertSafeEnvironment(passwords);

    const results: DemoKeycloakIdentity[] = [];
    for (const identity of DEMO_IDENTITIES.filter(usesKeycloak)) {
      results.push(await this.synchronizeIdentity(identity, passwords));
    }
    return results;
  }

  async status(): Promise<DemoKeycloakIdentity[]> {
    if (!this.enabled) return [];
    this.assertConfigured();
    const results: DemoKeycloakIdentity[] = [];
    for (const identity of DEMO_IDENTITIES.filter(usesKeycloak)) {
      const user = await this.findExact(identity);
      if (!user) continue;
      results.push(await this.present(identity, user));
    }
    return results;
  }

  async removeManifestIdentities() {
    if (!this.enabled) return { removed: 0 };
    this.assertConfigured();
    let removed = 0;
    for (const identity of DEMO_IDENTITIES.filter(usesKeycloak)) {
      const user = await this.findExact(identity);
      if (!user) continue;
      await this.request(
        `/users/${encodeURIComponent(this.subjectOf(user))}`,
        { method: 'DELETE' },
        [204],
      );
      removed += 1;
    }
    return { removed };
  }

  private async synchronizeIdentity(
    identity: DemoIdentity,
    passwords: ReadonlyMap<string, string>,
  ) {
    let user = await this.findExact(identity);
    if (!user) {
      const response = await this.request(
        '/users',
        {
          method: 'POST',
          body: JSON.stringify({
            username: identity.email,
            email: identity.email,
            firstName: identity.displayName.split(' ')[0],
            lastName: identity.displayName.split(' ').slice(1).join(' '),
            enabled: identity.keycloakEnabled,
            emailVerified: identity.emailVerified,
            requiredActions: identity.requiredActions,
            attributes: {
              demoSeedKey: [identity.seedKey],
            },
          }),
        },
        [201],
      );
      const location = response.headers.get('location');
      const subject = location?.split('/').pop();
      if (!subject) {
        throw new ServiceUnavailableException(
          'Keycloak n’a pas retourné le subject du compte créé.',
        );
      }
      user = { id: subject, username: identity.email, email: identity.email };
    }

    const subject = this.subjectOf(user);
    const credentials = await this.credentials(subject);
    const hasOtp = credentials.some((credential) => credential.type === 'otp');
    const requiredActions = identity.requiredActions.filter(
      (action) => action !== 'CONFIGURE_TOTP' || !hasOtp,
    );

    await this.request(
      `/users/${encodeURIComponent(subject)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          username: identity.email,
          email: identity.email,
          firstName: identity.displayName.split(' ')[0],
          lastName: identity.displayName.split(' ').slice(1).join(' '),
          enabled: identity.keycloakEnabled,
          emailVerified: identity.emailVerified,
          requiredActions,
          attributes: {
            demoSeedKey: [identity.seedKey],
          },
        }),
      },
      [204],
    );

    if (identity.keycloakPasswordVariable) {
      const password = passwords.get(identity.keycloakPasswordVariable);
      if (!password) {
        throw new ConflictException(
          `Variable ${identity.keycloakPasswordVariable} manquante.`,
        );
      }
      await this.request(
        `/users/${encodeURIComponent(subject)}/reset-password`,
        {
          method: 'PUT',
          body: JSON.stringify({
            type: 'password',
            temporary: false,
            value: password,
          }),
        },
        [204],
      );
    }

    return {
      seedKey: identity.seedKey,
      subject,
      emailVerified: identity.emailVerified,
      enabled: identity.keycloakEnabled,
      mfaConfigured: hasOtp,
      requiredActions,
    };
  }

  private async findExact(identity: DemoIdentity) {
    const users = await this.requestJson<KeycloakUser[]>(
      `/users?email=${encodeURIComponent(identity.email)}&exact=true`,
    );
    const matches = users.filter(
      (user) =>
        String(user.email ?? '').toLowerCase() === identity.email.toLowerCase(),
    );
    if (matches.length > 1) {
      throw new ConflictException(
        `Plusieurs identités Keycloak correspondent à ${identity.seedKey}.`,
      );
    }
    return matches[0] ?? null;
  }

  private async present(identity: DemoIdentity, user: KeycloakUser) {
    const subject = this.subjectOf(user);
    const credentials = await this.credentials(subject);
    return {
      seedKey: identity.seedKey,
      subject,
      emailVerified: user.emailVerified === true,
      enabled: user.enabled === true,
      mfaConfigured: credentials.some(
        (credential) => credential.type === 'otp',
      ),
      requiredActions: Array.isArray(user.requiredActions)
        ? user.requiredActions.filter(
            (action): action is string => typeof action === 'string',
          )
        : [],
    };
  }

  private credentials(subject: string) {
    return this.requestJson<KeycloakCredential[]>(
      `/users/${encodeURIComponent(subject)}/credentials`,
    );
  }

  private subjectOf(user: KeycloakUser) {
    if (typeof user.id !== 'string' || !user.id) {
      throw new ServiceUnavailableException(
        'Une identité Keycloak ne possède pas de subject exploitable.',
      );
    }
    return user.id;
  }

  private async requestJson<T>(path: string) {
    const response = await this.request(path, {}, [200]);
    return response.json() as Promise<T>;
  }

  private async request(
    path: string,
    init: RequestInit,
    expectedStatuses: number[],
  ) {
    const token = await this.serviceToken();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body) headers.set('Content-Type', 'application/json');
    const response = await this.fetchWithTimeout(
      `${this.internalUrl}/admin/realms/${encodeURIComponent(this.realm)}${path}`,
      { ...init, headers },
    );
    if (!expectedStatuses.includes(response.status)) {
      throw new ServiceUnavailableException(
        `Bootstrap Keycloak indisponible (statut ${response.status}).`,
      );
    }
    return response;
  }

  private async serviceToken() {
    if (this.token) return this.token;
    const response = await this.fetchWithTimeout(
      `${this.internalUrl}/realms/${encodeURIComponent(this.realm)}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      },
    );
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Le client de bootstrap Keycloak est indisponible.',
      );
    }
    const payload = (await response.json()) as KeycloakTokenResponse;
    if (typeof payload.access_token !== 'string') {
      throw new ServiceUnavailableException(
        'Le client de bootstrap Keycloak a retourné une réponse invalide.',
      );
    }
    this.token = payload.access_token;
    return this.token;
  }

  private async fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch {
      throw new ServiceUnavailableException(
        'Keycloak est momentanément indisponible.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private assertConfigured() {
    if (
      !this.internalUrl ||
      !this.realm ||
      !this.clientId ||
      !this.clientSecret
    ) {
      throw new ConflictException(
        'La configuration Keycloak du seed est incomplète.',
      );
    }
  }

  private assertSafeEnvironment(passwords: ReadonlyMap<string, string>) {
    if (process.env.NODE_ENV === 'production') {
      throw new ConflictException(
        'Le bootstrap des comptes de démonstration est interdit en production.',
      );
    }
    for (const identity of DEMO_IDENTITIES.filter(usesKeycloak)) {
      if (
        identity.keycloakPasswordVariable &&
        !passwords.get(identity.keycloakPasswordVariable)
      ) {
        throw new ConflictException(
          `Variable ${identity.keycloakPasswordVariable} manquante.`,
        );
      }
    }
  }

  private trim(value: string) {
    return value.replace(/\/+$/, '');
  }
}
