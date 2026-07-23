import { Role } from '../auth/role.enum';
import {
  IdentityMigrationStatus,
  IdentityProvider,
  ProfileVisibility,
} from '../auth/schemas/user.schema';

export const DEMO_SEED_SOURCE = 'connected-neighbours-demo';

export type DemoPasswordVariable =
  | 'SEED_DEMO_RESIDENT_PASSWORD'
  | 'SEED_DEMO_ADMIN_PASSWORD'
  | 'SEED_DEMO_MODERATOR_PASSWORD'
  | 'SEED_DEMO_LEGACY_PASSWORD';

export type DemoIdentityMode =
  | 'linked'
  | 'keycloak_only'
  | 'local_only'
  | 'link_required';

export type DemoIdentity = {
  seedKey: string;
  displayName: string;
  email: string;
  role: Role;
  neighborhoodSlug: string;
  mode: DemoIdentityMode;
  passwordVariable: DemoPasswordVariable | null;
  keycloakPasswordVariable: DemoPasswordVariable | null;
  keycloakEnabled: boolean;
  emailVerified: boolean;
  requiredActions: string[];
  isActive: boolean;
  onboardingCompleted: boolean;
  pointsBalance: number;
  bio: string;
  interests: string[];
  profileVisibility: ProfileVisibility;
};

const resident = (
  seedKey: string,
  displayName: string,
  email: string,
  neighborhoodSlug: string,
  interests: string[],
  bio: string,
): DemoIdentity => ({
  seedKey,
  displayName,
  email,
  role: Role.RESIDENT,
  neighborhoodSlug,
  mode: 'linked',
  passwordVariable: 'SEED_DEMO_RESIDENT_PASSWORD',
  keycloakPasswordVariable: 'SEED_DEMO_RESIDENT_PASSWORD',
  keycloakEnabled: true,
  emailVerified: true,
  requiredActions: [],
  isActive: true,
  onboardingCompleted: true,
  pointsBalance: 100,
  bio,
  interests,
  profileVisibility: ProfileVisibility.NEIGHBORHOOD,
});

export const DEMO_IDENTITIES: readonly DemoIdentity[] = [
  {
    seedKey: 'demo-admin',
    displayName: 'Admin Demo',
    email: 'admin@connected-neighbours.local',
    role: Role.ADMIN,
    neighborhoodSlug: 'quartier-centre',
    mode: 'linked',
    passwordVariable: 'SEED_DEMO_ADMIN_PASSWORD',
    keycloakPasswordVariable: 'SEED_DEMO_ADMIN_PASSWORD',
    keycloakEnabled: true,
    emailVerified: true,
    requiredActions: ['CONFIGURE_TOTP'],
    isActive: true,
    onboardingCompleted: true,
    pointsBalance: 100,
    bio: 'Compte d’administration réservé à la démonstration locale.',
    interests: ['vie locale'],
    profileVisibility: ProfileVisibility.PRIVATE,
  },
  {
    seedKey: 'demo-moderator',
    displayName: 'Modération Demo',
    email: 'moderator@connected-neighbours.local',
    role: Role.MODERATOR,
    neighborhoodSlug: 'quartier-centre',
    mode: 'linked',
    passwordVariable: 'SEED_DEMO_MODERATOR_PASSWORD',
    keycloakPasswordVariable: 'SEED_DEMO_MODERATOR_PASSWORD',
    keycloakEnabled: true,
    emailVerified: true,
    requiredActions: ['CONFIGURE_TOTP'],
    isActive: true,
    onboardingCompleted: true,
    pointsBalance: 100,
    bio: 'Compte de modération réservé à la démonstration locale.',
    interests: ['médiation', 'vie locale'],
    profileVisibility: ProfileVisibility.PRIVATE,
  },
  {
    ...resident(
      'demo-alice',
      'Alice Martin',
      'alice@connected-neighbours.local',
      'quartier-centre',
      ['bricolage', 'jardinage', 'vie locale'],
      'Habitante engagée qui aime organiser des projets entre voisins.',
    ),
    pointsBalance: 100,
  },
  {
    ...resident(
      'demo-bob',
      'Bob Dupont',
      'bob@connected-neighbours.local',
      'quartier-centre',
      ['bricolage', 'informatique', 'animaux'],
      'Voisin disponible pour le bricolage et l’aide informatique.',
    ),
    pointsBalance: 125,
  },
  resident(
    'demo-claire',
    'Claire Bernard',
    'claire@connected-neighbours.local',
    'quartier-centre',
    ['cours', 'langues', 'musique'],
    'Professeure de langues et bénévole pour l’aide scolaire.',
  ),
  resident(
    'demo-nadia',
    'Nadia Petit',
    'nadia@connected-neighbours.local',
    'quartier-residentiel',
    ['cuisine', 'sport', 'vie locale'],
    'Toujours partante pour un repas partagé ou une sortie sportive.',
  ),
  resident(
    'demo-hugo',
    'Hugo Leroy',
    'hugo@connected-neighbours.local',
    'quartier-universitaire',
    ['informatique', 'transport', 'aide scolaire'],
    'Étudiant en informatique, disponible en soirée et le week-end.',
  ),
  resident(
    'demo-sarah',
    'Sarah Fontaine',
    'sarah@connected-neighbours.local',
    'quartier-familial',
    ['animaux', 'cuisine', 'aide scolaire'],
    'Parent d’élève et voisine attentive aux initiatives familiales.',
  ),
  resident(
    'demo-mehdi',
    'Mehdi Roux',
    'mehdi@connected-neighbours.local',
    'quartier-peripherique',
    ['transport', 'bricolage', 'sport'],
    'Conducteur solidaire et amateur de réparation de vélos.',
  ),
  resident(
    'demo-julie',
    'Julie Moreau',
    'julie@connected-neighbours.local',
    'quartier-jardins',
    ['jardinage', 'animaux', 'cuisine'],
    'Passionnée de jardinage urbain et de cuisine de saison.',
  ),
  resident(
    'demo-lucas',
    'Lucas Garnier',
    'lucas@connected-neighbours.local',
    'quartier-universitaire',
    ['musique', 'langues', 'sport'],
    'Musicien amateur et organisateur de rencontres culturelles.',
  ),
  resident(
    'demo-emma',
    'Emma Renaud',
    'emma@connected-neighbours.local',
    'quartier-residentiel',
    ['aide administrative', 'langues', 'vie locale'],
    'Disponible pour accompagner les démarches du quotidien.',
  ),
  {
    ...resident(
      'demo-keycloak-only',
      'Lina Keycloak',
      'lina.keycloak@connected-neighbours.local',
      'quartier-familial',
      ['cuisine', 'animaux'],
      'Compte de démonstration accessible uniquement avec Keycloak.',
    ),
    mode: 'keycloak_only',
    passwordVariable: null,
    onboardingCompleted: true,
  },
  {
    ...resident(
      'demo-local-only',
      'Marc Héritage',
      'marc.legacy@connected-neighbours.local',
      'quartier-peripherique',
      ['bricolage', 'transport'],
      'Compte historique local destiné à la recette de migration.',
    ),
    mode: 'local_only',
    passwordVariable: 'SEED_DEMO_LEGACY_PASSWORD',
    keycloakPasswordVariable: null,
  },
  {
    ...resident(
      'demo-link-required',
      'Sophie Liaison',
      'sophie.link@connected-neighbours.local',
      'quartier-centre',
      ['langues', 'aide scolaire'],
      'Compte destiné à tester la liaison explicite des identités.',
    ),
    mode: 'link_required',
    passwordVariable: 'SEED_DEMO_LEGACY_PASSWORD',
    keycloakPasswordVariable: 'SEED_DEMO_RESIDENT_PASSWORD',
  },
  {
    ...resident(
      'demo-disabled',
      'Thomas Désactivé',
      'thomas.disabled@connected-neighbours.local',
      'quartier-residentiel',
      ['sport'],
      'Compte désactivé réservé aux contrôles d’accès.',
    ),
    isActive: false,
  },
  {
    ...resident(
      'demo-unverified',
      'Élodie Vérification',
      'elodie.unverified@connected-neighbours.local',
      'quartier-jardins',
      ['jardinage'],
      'Compte réservé au parcours de vérification de l’adresse e-mail.',
    ),
    emailVerified: false,
    requiredActions: ['VERIFY_EMAIL'],
  },
] as const;

export const DEMO_IDENTITY_BY_KEY = new Map(
  DEMO_IDENTITIES.map((identity) => [identity.seedKey, identity]),
);

export function identityProviderFor(identity: DemoIdentity) {
  if (identity.mode === 'linked') return IdentityProvider.LINKED;
  if (identity.mode === 'keycloak_only') return IdentityProvider.KEYCLOAK;
  return IdentityProvider.LOCAL;
}

export function migrationStatusFor(identity: DemoIdentity) {
  switch (identity.mode) {
    case 'linked':
      return IdentityMigrationStatus.LINKED;
    case 'keycloak_only':
      return IdentityMigrationStatus.KEYCLOAK_ONLY;
    case 'link_required':
      return IdentityMigrationStatus.LINK_REQUIRED;
    case 'local_only':
      return IdentityMigrationStatus.LOCAL_ONLY;
  }
}

export function usesKeycloak(identity: DemoIdentity) {
  return identity.mode !== 'local_only';
}

export function usesLocalPassword(identity: DemoIdentity) {
  return identity.passwordVariable !== null;
}
