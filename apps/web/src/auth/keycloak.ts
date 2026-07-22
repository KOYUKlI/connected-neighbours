import Keycloak from 'keycloak-js';

const enabled = import.meta.env.VITE_KEYCLOAK_ENABLED === 'true';
const config = {
  url: import.meta.env.VITE_KEYCLOAK_URL ?? '',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
};

let keycloak: Keycloak | null = null;
let initialization: Promise<boolean> | null = null;
let refresh: Promise<boolean> | null = null;

export function isKeycloakAuthEnabled() {
  return enabled;
}

export function isKeycloakConfigured() {
  return Boolean(config.url && config.realm && config.clientId);
}

export function getKeycloakAccountUrl() {
  const configuredUrl = import.meta.env.VITE_KEYCLOAK_ACCOUNT_URL;
  if (configuredUrl) return configuredUrl;
  if (!config.url || !config.realm) return null;
  return `${config.url.replace(/\/+$/, '')}/realms/${config.realm}/account`;
}

export async function initializeKeycloak(force = false) {
  if ((!enabled && !force) || !isKeycloakConfigured()) return false;

  keycloak ??= new Keycloak(config);
  initialization ??= keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  });

  return initialization;
}

export async function getKeycloakAccessToken() {
  if (!keycloak?.authenticated) return null;

  if (keycloak.isTokenExpired(30)) {
    refresh ??= keycloak.updateToken(30).finally(() => {
      refresh = null;
    });
    await refresh;
  }

  return keycloak.token ?? null;
}

export async function startKeycloakLogin(redirectUri: string) {
  await initializeKeycloak(true);
  if (!keycloak) throw new Error('Keycloak n’est pas configuré.');
  await keycloak.login({ redirectUri });
}

export async function startKeycloakRegistration(redirectUri: string) {
  await initializeKeycloak(true);
  if (!keycloak) throw new Error('Keycloak n’est pas configuré.');
  await keycloak.register({ redirectUri });
}

export async function logoutFromKeycloak(redirectUri: string) {
  if (!keycloak) return;
  await keycloak.logout({ redirectUri });
}