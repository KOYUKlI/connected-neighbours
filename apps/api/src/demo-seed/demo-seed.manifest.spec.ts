import { Role } from '../auth/role.enum';
import {
  DEMO_IDENTITIES,
  migrationStatusFor,
  usesKeycloak,
  usesLocalPassword,
} from './demo-seed.manifest';

describe('demo seed manifest', () => {
  it('keeps stable identifiers and emails unique', () => {
    expect(new Set(DEMO_IDENTITIES.map((item) => item.seedKey)).size).toBe(
      DEMO_IDENTITIES.length,
    );
    expect(new Set(DEMO_IDENTITIES.map((item) => item.email)).size).toBe(
      DEMO_IDENTITIES.length,
    );
  });

  it('contains the expected identity migration scenarios', () => {
    const modes = new Set(DEMO_IDENTITIES.map((item) => item.mode));
    expect(modes).toEqual(
      new Set(['linked', 'keycloak_only', 'local_only', 'link_required']),
    );
    expect(
      DEMO_IDENTITIES.filter((item) => item.role === Role.RESIDENT),
    ).toHaveLength(15);
  });

  it('never grants an administrative role to a resident scenario', () => {
    const administrators = DEMO_IDENTITIES.filter(
      (item) => item.role !== Role.RESIDENT,
    );
    expect(administrators.map((item) => item.seedKey).sort()).toEqual([
      'demo-admin',
      'demo-moderator',
    ]);
  });

  it('keeps local-only and Keycloak-only behavior explicit', () => {
    const localOnly = DEMO_IDENTITIES.find(
      (item) => item.mode === 'local_only',
    );
    const keycloakOnly = DEMO_IDENTITIES.find(
      (item) => item.mode === 'keycloak_only',
    );
    expect(localOnly && usesLocalPassword(localOnly)).toBe(true);
    expect(localOnly && usesKeycloak(localOnly)).toBe(false);
    expect(keycloakOnly && usesLocalPassword(keycloakOnly)).toBe(false);
    expect(keycloakOnly && usesKeycloak(keycloakOnly)).toBe(true);
    expect(keycloakOnly && migrationStatusFor(keycloakOnly)).toBe(
      'keycloak_only',
    );
  });

  it('requires TOTP only for privileged demo accounts', () => {
    const totpAccounts = DEMO_IDENTITIES.filter((item) =>
      item.requiredActions.includes('CONFIGURE_TOTP'),
    );
    expect(totpAccounts.map((item) => item.role).sort()).toEqual([
      Role.ADMIN,
      Role.MODERATOR,
    ]);
  });
});
