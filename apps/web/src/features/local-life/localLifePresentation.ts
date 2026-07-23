import type { EventCategory, EventResponseStatus, EventStatus } from '../../api/events';
import type { VoteBallotType, VotePrivacy, VoteStatus } from '../../api/votes';

export const eventCategoryLabels: Record<EventCategory, string> = {
  workshop: 'Atelier',
  party: 'Fête',
  fundraising: 'Solidarité',
  sport: 'Sport',
  community_meeting: 'Réunion de quartier',
  children: 'Enfants',
  culture: 'Culture',
  help: 'Entraide',
  emergency: 'Urgence',
  other: 'Autre',
};

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  open_registration: 'Inscriptions ouvertes',
  full: 'Complet',
  started: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  archived: 'Archivé',
};

export const eventResponseLabels: Record<EventResponseStatus, string> = {
  interested: 'Intéressé',
  going: 'Je participe',
  maybe: 'Peut-être',
  not_interested: 'Pas intéressé',
  cancelled: 'Participation annulée',
  waitlisted: 'Liste d’attente',
};

export const voteStatusLabels: Record<VoteStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifié',
  open: 'Ouvert',
  closed: 'Clos',
  cancelled: 'Annulé',
  archived: 'Archivé',
};

export const voteTypeLabels: Record<VoteBallotType, string> = {
  yes_no: 'Oui / Non',
  single_choice: 'Choix unique',
  multiple_choice: 'Choix multiple',
  ranking: 'Classement',
};

export const votePrivacyLabels: Record<VotePrivacy, string> = {
  anonymous: 'Vote anonyme',
  public: 'Vote public',
};
