import { EventCategory, EventStatus } from '../events/schemas/event.schema';
import {
  NeighborhoodStatus,
  type GeoJsonPoint,
  type GeoJsonPolygon,
} from '../neighborhoods/schemas/neighborhood.schema';
import { ServiceStatus, ServiceType } from '../services/schemas/service.schema';
import {
  VoteBallotType,
  VotePrivacy,
  VoteResultsVisibility,
  VoteStatus,
} from '../votes/schemas/vote.schema';

export type DemoNeighborhood = {
  slug: string;
  name: string;
  description: string;
  city: string;
  postalCode: string;
  postalCodes: string[];
  geometry: GeoJsonPolygon;
  center: GeoJsonPoint;
  status: NeighborhoodStatus;
};

const polygon = (
  west: number,
  south: number,
  east: number,
  north: number,
): GeoJsonPolygon => ({
  type: 'Polygon',
  coordinates: [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ],
  ],
});

const point = (longitude: number, latitude: number): GeoJsonPoint => ({
  type: 'Point',
  coordinates: [longitude, latitude],
});

export const DEMO_NEIGHBORHOODS: readonly DemoNeighborhood[] = [
  {
    slug: 'quartier-centre',
    name: 'Quartier Centre',
    description: 'Le cœur commerçant et associatif de la ville.',
    city: 'Paris',
    postalCode: '75004',
    postalCodes: ['75003', '75004'],
    geometry: polygon(2.34, 48.85, 2.35, 48.86),
    center: point(2.345, 48.855),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    slug: 'quartier-residentiel',
    name: 'Quartier Résidentiel',
    description: 'Un quartier calme organisé autour de ses places arborées.',
    city: 'Paris',
    postalCode: '75011',
    postalCodes: ['75011'],
    geometry: polygon(2.35, 48.85, 2.36, 48.86),
    center: point(2.355, 48.855),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    slug: 'quartier-universitaire',
    name: 'Quartier Universitaire',
    description: 'Un quartier vivant partagé par étudiants et riverains.',
    city: 'Paris',
    postalCode: '75005',
    postalCodes: ['75005'],
    geometry: polygon(2.34, 48.86, 2.35, 48.87),
    center: point(2.345, 48.865),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    slug: 'quartier-familial',
    name: 'Quartier Familial',
    description: 'Écoles, équipements sportifs et initiatives familiales.',
    city: 'Paris',
    postalCode: '75012',
    postalCodes: ['75012'],
    geometry: polygon(2.35, 48.86, 2.36, 48.87),
    center: point(2.355, 48.865),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    slug: 'quartier-peripherique',
    name: 'Quartier Périphérique',
    description: 'Un secteur connecté aux communes et quartiers voisins.',
    city: 'Paris',
    postalCode: '75020',
    postalCodes: ['75019', '75020'],
    geometry: polygon(2.36, 48.85, 2.37, 48.86),
    center: point(2.365, 48.855),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    slug: 'quartier-jardins',
    name: 'Quartier des Jardins',
    description: 'Jardins partagés et projets de végétalisation locale.',
    city: 'Paris',
    postalCode: '75013',
    postalCodes: ['75013'],
    geometry: polygon(2.36, 48.86, 2.37, 48.87),
    center: point(2.365, 48.865),
    status: NeighborhoodStatus.ACTIVE,
  },
] as const;

export type DemoCatalogService = {
  ownerEmail: string;
  title: string;
  description: string;
  type: ServiceType;
  category: string;
  availability: string;
  isPaid: boolean;
  pricePoints: number | null;
  status: ServiceStatus;
};

export const DEMO_SERVICE_CATALOG: readonly DemoCatalogService[] = [
  {
    ownerEmail: 'nadia@connected-neighbours.local',
    title: 'Préparer un buffet de quartier',
    description:
      'Je propose mon aide pour préparer un buffet simple et convivial.',
    type: ServiceType.OFFER,
    category: 'Cuisine',
    availability: 'Samedi matin',
    isPaid: true,
    pricePoints: 18,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'emma@connected-neighbours.local',
    title: 'Aide pour un dossier administratif',
    description:
      'Je peux relire et organiser vos démarches administratives courantes.',
    type: ServiceType.OFFER,
    category: 'Administration',
    availability: 'Mardi ou jeudi soir',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'nadia@connected-neighbours.local',
    title: 'Partenaire pour courir le dimanche',
    description:
      'Je cherche une personne pour une sortie sportive à allure tranquille.',
    type: ServiceType.REQUEST,
    category: 'Sport',
    availability: 'Dimanche à 9 h',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'hugo@connected-neighbours.local',
    title: 'Installer Linux sur un ordinateur',
    description:
      'Installation et prise en main d’une distribution adaptée aux débutants.',
    type: ServiceType.OFFER,
    category: 'Informatique',
    availability: 'Vendredi après-midi',
    isPaid: true,
    pricePoints: 20,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'lucas@connected-neighbours.local',
    title: 'Initiation à la guitare',
    description: 'Premiers accords et rythme pour débuter sans pression.',
    type: ServiceType.OFFER,
    category: 'Musique',
    availability: 'Mercredi soir',
    isPaid: true,
    pricePoints: 15,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'hugo@connected-neighbours.local',
    title: 'Cherche covoiturage vers la bibliothèque',
    description:
      'Trajet ponctuel pour transporter plusieurs cartons de livres.',
    type: ServiceType.REQUEST,
    category: 'Mobilité',
    availability: 'Lundi à 17 h',
    isPaid: true,
    pricePoints: 8,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'sarah@connected-neighbours.local',
    title: 'Garde de chien en soirée',
    description:
      'Je recherche une personne de confiance pour garder mon chien.',
    type: ServiceType.REQUEST,
    category: 'Animaux',
    availability: 'Vendredi de 19 h à 23 h',
    isPaid: true,
    pricePoints: 22,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'lina.keycloak@connected-neighbours.local',
    title: 'Atelier goûter fait maison',
    description:
      'Je propose de préparer un goûter avec les familles du quartier.',
    type: ServiceType.OFFER,
    category: 'Cuisine',
    availability: 'Samedi après-midi',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'sarah@connected-neighbours.local',
    title: 'Révisions de français au collège',
    description:
      'Besoin d’un coup de main pour préparer une évaluation de français.',
    type: ServiceType.REQUEST,
    category: 'Cours',
    availability: 'Mercredi à 16 h',
    isPaid: true,
    pricePoints: 12,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'mehdi@connected-neighbours.local',
    title: 'Réparation de vélo',
    description:
      'Réglage des freins, changement de chambre à air et conseils d’entretien.',
    type: ServiceType.OFFER,
    category: 'Mobilité',
    availability: 'Samedi matin',
    isPaid: true,
    pricePoints: 16,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'marc.legacy@connected-neighbours.local',
    title: 'Transport d’un petit meuble',
    description: 'Je peux aider à déplacer un petit meuble dans le quartier.',
    type: ServiceType.OFFER,
    category: 'Transport',
    availability: 'En semaine après 18 h',
    isPaid: true,
    pricePoints: 14,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'mehdi@connected-neighbours.local',
    title: 'Fixer une tringle à rideaux',
    description:
      'Je cherche une personne équipée pour poser une tringle correctement.',
    type: ServiceType.REQUEST,
    category: 'Bricolage',
    availability: 'Mardi soir',
    isPaid: true,
    pricePoints: 10,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'julie@connected-neighbours.local',
    title: 'Conseils pour un balcon potager',
    description: 'Choix des plantes, disposition et calendrier d’entretien.',
    type: ServiceType.OFFER,
    category: 'Jardinage',
    availability: 'Dimanche après-midi',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'elodie.unverified@connected-neighbours.local',
    title: 'Arroser un jardin partagé',
    description:
      'Demande enregistrée en brouillon en attendant la vérification du compte.',
    type: ServiceType.REQUEST,
    category: 'Jardinage',
    availability: 'À convenir',
    isPaid: true,
    pricePoints: 9,
    status: ServiceStatus.DRAFT,
  },
  {
    ownerEmail: 'julie@connected-neighbours.local',
    title: 'Échange de boutures',
    description:
      'Je propose plusieurs boutures robustes contre des plants aromatiques.',
    type: ServiceType.OFFER,
    category: 'Jardinage',
    availability: 'Samedi matin',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'alice@connected-neighbours.local',
    title: 'Réparer une poignée de porte',
    description: 'Petite réparation à effectuer avant la fin de semaine.',
    type: ServiceType.REQUEST,
    category: 'Bricolage',
    availability: 'Avant vendredi',
    isPaid: true,
    pricePoints: 12,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'bob@connected-neighbours.local',
    title: 'Configurer une sauvegarde automatique',
    description:
      'Je peux sécuriser vos documents avec une sauvegarde locale simple.',
    type: ServiceType.OFFER,
    category: 'Informatique',
    availability: 'Lundi soir',
    isPaid: true,
    pricePoints: 18,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'claire@connected-neighbours.local',
    title: 'Conversation en anglais',
    description:
      'Une heure de conversation pour pratiquer dans une ambiance détendue.',
    type: ServiceType.OFFER,
    category: 'Langues',
    availability: 'Jeudi soir',
    isPaid: true,
    pricePoints: 14,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'sophie.link@connected-neighbours.local',
    title: 'Relire une lettre de motivation',
    description: 'Brouillon réservé au test de liaison de compte.',
    type: ServiceType.OFFER,
    category: 'Administration',
    availability: 'À définir',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.DRAFT,
  },
  {
    ownerEmail: 'emma@connected-neighbours.local',
    title: 'Traduction d’un courrier court',
    description: 'Aide ponctuelle pour comprendre un courrier en anglais.',
    type: ServiceType.OFFER,
    category: 'Langues',
    availability: 'Cette semaine',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'lucas@connected-neighbours.local',
    title: 'Accompagnement à un concert local',
    description: 'Je cherche un voisin intéressé par le concert de samedi.',
    type: ServiceType.REQUEST,
    category: 'Culture',
    availability: 'Samedi soir',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'marc.legacy@connected-neighbours.local',
    title: 'Réparer un tabouret ancien',
    description: 'Annonce annulée après résolution du besoin par un proche.',
    type: ServiceType.REQUEST,
    category: 'Bricolage',
    availability: 'Annulé',
    isPaid: true,
    pricePoints: 10,
    status: ServiceStatus.CANCELLED,
  },
  {
    ownerEmail: 'lina.keycloak@connected-neighbours.local',
    title: 'Promenade de chien à deux',
    description: 'Une promenade conviviale pour socialiser nos chiens.',
    type: ServiceType.OFFER,
    category: 'Animaux',
    availability: 'Dimanche à 11 h',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.PUBLISHED,
  },
  {
    ownerEmail: 'nadia@connected-neighbours.local',
    title: 'Organiser les recettes du quartier',
    description:
      'Brouillon pour compiler les recettes partagées lors des événements.',
    type: ServiceType.REQUEST,
    category: 'Cuisine',
    availability: 'À définir',
    isPaid: false,
    pricePoints: null,
    status: ServiceStatus.DRAFT,
  },
] as const;

export type DemoCatalogEvent = {
  organizerEmail: string;
  neighborhoodSlug: string;
  title: string;
  description: string;
  category: EventCategory;
  startsAt: Date;
  endsAt: Date;
  locationLabel: string;
  capacity: number | null;
  status: EventStatus;
};

export const DEMO_EVENT_CATALOG: readonly DemoCatalogEvent[] = [
  {
    organizerEmail: 'nadia@connected-neighbours.local',
    neighborhoodSlug: 'quartier-residentiel',
    title: 'Petit-déjeuner des voisins',
    description: 'Un moment simple pour rencontrer les habitants de la place.',
    category: EventCategory.COMMUNITY_MEETING,
    startsAt: new Date('2026-10-03T08:00:00.000Z'),
    endsAt: new Date('2026-10-03T10:00:00.000Z'),
    locationLabel: 'Kiosque de la place',
    capacity: 40,
    status: EventStatus.OPEN_REGISTRATION,
  },
  {
    organizerEmail: 'hugo@connected-neighbours.local',
    neighborhoodSlug: 'quartier-universitaire',
    title: 'Atelier sécurité numérique',
    description:
      'Des conseils pratiques pour protéger ses comptes et ses appareils.',
    category: EventCategory.WORKSHOP,
    startsAt: new Date('2026-10-08T16:00:00.000Z'),
    endsAt: new Date('2026-10-08T18:00:00.000Z'),
    locationLabel: 'Bibliothèque universitaire',
    capacity: 25,
    status: EventStatus.OPEN_REGISTRATION,
  },
  {
    organizerEmail: 'sarah@connected-neighbours.local',
    neighborhoodSlug: 'quartier-familial',
    title: 'Bourse aux livres jeunesse',
    description: 'Échange gratuit de livres pour les enfants et adolescents.',
    category: EventCategory.FUNDRAISING,
    startsAt: new Date('2026-10-11T12:00:00.000Z'),
    endsAt: new Date('2026-10-11T16:00:00.000Z'),
    locationLabel: 'Préau de l’école',
    capacity: null,
    status: EventStatus.OPEN_REGISTRATION,
  },
  {
    organizerEmail: 'mehdi@connected-neighbours.local',
    neighborhoodSlug: 'quartier-peripherique',
    title: 'Balade vélo des quartiers',
    description:
      'Parcours accessible avec vérification des vélos avant le départ.',
    category: EventCategory.SPORT,
    startsAt: new Date('2026-10-18T08:30:00.000Z'),
    endsAt: new Date('2026-10-18T11:30:00.000Z'),
    locationLabel: 'Parvis du gymnase',
    capacity: 35,
    status: EventStatus.OPEN_REGISTRATION,
  },
  {
    organizerEmail: 'julie@connected-neighbours.local',
    neighborhoodSlug: 'quartier-jardins',
    title: 'Préparer le jardin pour l’hiver',
    description:
      'Paillage, taille légère et partage des tâches du jardin collectif.',
    category: EventCategory.HELP,
    startsAt: new Date('2026-10-24T08:00:00.000Z'),
    endsAt: new Date('2026-10-24T11:00:00.000Z'),
    locationLabel: 'Jardin partagé des Tilleuls',
    capacity: 18,
    status: EventStatus.OPEN_REGISTRATION,
  },
  {
    organizerEmail: 'lucas@connected-neighbours.local',
    neighborhoodSlug: 'quartier-universitaire',
    title: 'Scène musicale ouverte',
    description: 'Une soirée pour écouter les talents amateurs du quartier.',
    category: EventCategory.CULTURE,
    startsAt: new Date('2026-11-06T18:00:00.000Z'),
    endsAt: new Date('2026-11-06T21:00:00.000Z'),
    locationLabel: 'Café associatif',
    capacity: 60,
    status: EventStatus.DRAFT,
  },
  {
    organizerEmail: 'emma@connected-neighbours.local',
    neighborhoodSlug: 'quartier-residentiel',
    title: 'Permanence démarches du quotidien',
    description:
      'Aide gratuite pour comprendre les démarches administratives courantes.',
    category: EventCategory.HELP,
    startsAt: new Date('2026-08-12T14:00:00.000Z'),
    endsAt: new Date('2026-08-12T17:00:00.000Z'),
    locationLabel: 'Maison des associations',
    capacity: 12,
    status: EventStatus.COMPLETED,
  },
] as const;

export type DemoCatalogVote = {
  neighborhoodSlug: string;
  title: string;
  ballotType: VoteBallotType;
  privacy: VotePrivacy;
  resultsVisibility: VoteResultsVisibility;
  status: VoteStatus;
  opensAt: Date;
  closesAt: Date;
  options: string[];
  allowAnswerChange: boolean;
  minSelections?: number;
  maxSelections?: number;
};

export const DEMO_VOTE_CATALOG: readonly DemoCatalogVote[] = [
  {
    neighborhoodSlug: 'quartier-residentiel',
    title: 'Quel jour pour le marché de producteurs ?',
    ballotType: VoteBallotType.SINGLE_CHOICE,
    privacy: VotePrivacy.PUBLIC,
    resultsVisibility: VoteResultsVisibility.ALWAYS,
    status: VoteStatus.OPEN,
    opensAt: new Date('2026-07-10T08:00:00.000Z'),
    closesAt: new Date('2026-09-30T18:00:00.000Z'),
    options: ['Mercredi', 'Samedi', 'Dimanche'],
    allowAnswerChange: true,
  },
  {
    neighborhoodSlug: 'quartier-universitaire',
    title: 'Étendre les horaires de la bibliothèque ?',
    ballotType: VoteBallotType.YES_NO,
    privacy: VotePrivacy.ANONYMOUS,
    resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
    status: VoteStatus.OPEN,
    opensAt: new Date('2026-07-20T08:00:00.000Z'),
    closesAt: new Date('2026-10-01T18:00:00.000Z'),
    options: ['Oui', 'Non'],
    allowAnswerChange: false,
  },
  {
    neighborhoodSlug: 'quartier-familial',
    title: 'Priorité des activités familiales',
    ballotType: VoteBallotType.RANKING,
    privacy: VotePrivacy.PUBLIC,
    resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
    status: VoteStatus.SCHEDULED,
    opensAt: new Date('2026-09-01T08:00:00.000Z'),
    closesAt: new Date('2026-09-25T18:00:00.000Z'),
    options: ['Sport', 'Lecture', 'Cuisine'],
    allowAnswerChange: true,
  },
  {
    neighborhoodSlug: 'quartier-peripherique',
    title: 'Équipements à ajouter au local vélo',
    ballotType: VoteBallotType.MULTIPLE_CHOICE,
    privacy: VotePrivacy.PUBLIC,
    resultsVisibility: VoteResultsVisibility.AFTER_SUBMISSION,
    status: VoteStatus.OPEN,
    opensAt: new Date('2026-07-05T08:00:00.000Z'),
    closesAt: new Date('2026-09-05T18:00:00.000Z'),
    options: ['Pompe', 'Outils', 'Casier sécurisé'],
    allowAnswerChange: true,
    minSelections: 1,
    maxSelections: 2,
  },
  {
    neighborhoodSlug: 'quartier-jardins',
    title: 'Choisir les plantations de printemps',
    ballotType: VoteBallotType.MULTIPLE_CHOICE,
    privacy: VotePrivacy.PUBLIC,
    resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
    status: VoteStatus.CLOSED,
    opensAt: new Date('2026-05-01T08:00:00.000Z'),
    closesAt: new Date('2026-06-01T18:00:00.000Z'),
    options: ['Aromatiques', 'Fleurs mellifères', 'Petits fruits'],
    allowAnswerChange: false,
    minSelections: 1,
    maxSelections: 2,
  },
] as const;
