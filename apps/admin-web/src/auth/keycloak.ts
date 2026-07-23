import Keycloak from 'keycloak-js';

const enabled = import.meta.env.VITE_KEYCLOAK_ENABLED === 'true';
const config = {
  url: import.meta.env.VITE_KEYCLOAK_URL ?? '',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  clientId:
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'connected-neighbours-admin',
};

let keycloak: Keycloak | null = null;
let initialization: Promise<boolean> | null = null;
let refresh: Promise<boolean> | null = null;

export function isAdminKeycloakEnabled() {
  return enabled;
}

export async function initializeAdminKeycloak() {
  if (!enabled || !config.url || !config.realm || !config.clientId) return false;
  keycloak ??= new Keycloak(config);
  initialization ??= keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  });
  return initialization;
}

export async function getAdminKeycloakToken() {
  if (!keycloak?.authenticated) return null;
  if (keycloak.isTokenExpired(30)) {
    refresh ??= keycloak.updateToken(30).finally(() => {
      refresh = null;
    });
    await refresh;
  }
  return keycloak.token ?? null;
}

export async function startAdminKeycloakLogin() {
  await initializeAdminKeycloak();
  if (!keycloak) throw new Error('Keycloak n’est pas configuré.');
  await keycloak.login({ redirectUri: window.location.origin });
}

export async function logoutAdminKeycloak() {
  if (!keycloak) return;
  await keycloak.logout({ redirectUri: window.location.origin });
}