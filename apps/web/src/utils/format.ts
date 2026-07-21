import type { NeighborhoodItem } from '../api/neighborhoods';
import type { ServiceItem, ServiceStatus, ServiceType } from '../api/services';

export function getEntityId(entity: { id?: string; _id?: string }) {
  return entity.id ?? entity._id ?? '';
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Date non renseignée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date non renseignée';
  return new Intl.DateTimeFormat(
    'fr-FR',
    options ?? { day: '2-digit', month: 'short', year: 'numeric' },
  ).format(date);
}

export function formatInitials(value?: string) {
  const words = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return 'CN';
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export function formatNeighborhood(
  neighborhoodId: string | undefined,
  neighborhoods: NeighborhoodItem[],
  service?: ServiceItem,
) {
  if (service?.neighborhood) {
    return [service.neighborhood.name, service.neighborhood.city]
      .filter(Boolean)
      .join(', ');
  }
  const neighborhood = neighborhoods.find(
    (item) => getEntityId(item) === neighborhoodId || item.slug === neighborhoodId,
  );
  if (!neighborhood) return 'Quartier non renseigné';
  return [neighborhood.name, neighborhood.city].filter(Boolean).join(', ');
}

export function formatOwner(service: ServiceItem, currentUserId?: string) {
  if (service.viewer?.isOwner || service.ownerId === currentUserId) return 'Vous';
  return service.owner?.displayName?.trim() || 'Utilisateur inconnu';
}

export const serviceTypeLabels: Record<ServiceType, string> = {
  offer: 'Offre',
  request: 'Demande',
};

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  accepted: 'Accepté',
  application_received: 'Candidatures reçues',
  awaiting_signatures: 'Contrat à signer',
  cancelled: 'Annulé',
  candidate_selected: 'Candidat choisi',
  completed: 'Terminé',
  contract_active: 'Contrat actif',
  contract_pending: 'Contrat en préparation',
  disputed: 'En litige',
  draft: 'Brouillon',
  in_progress: 'En cours',
  published: 'Publié',
};
