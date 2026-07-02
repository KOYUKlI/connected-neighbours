import type {
  AdminServiceRow,
  AdminUserRow,
} from '../api/admin';
import type { NeighborhoodItem } from '../api/neighborhoods';

export function formatShortId(id?: string | null) {
  if (!id) {
    return '—';
  }

  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function formatUserLabel(userId?: string | null, users: AdminUserRow[] = []) {
  if (!userId) {
    return 'Utilisateur inconnu';
  }

  const user = users.find((item) => item.id === userId);

  if (!user) {
    return 'Utilisateur inconnu';
  }

  return user.displayName ?? user.email ?? 'Utilisateur inconnu';
}

export function formatNeighborhoodLabel(
  neighborhoodId?: string | null,
  neighborhoods: NeighborhoodItem[] = [],
) {
  if (!neighborhoodId) {
    return '—';
  }

  const neighborhood = neighborhoods.find(
    (item) =>
      item.id === neighborhoodId ||
      item._id === neighborhoodId ||
      item.slug === neighborhoodId,
  );

  return neighborhood?.name ?? formatSlugLabel(neighborhoodId);
}

export function formatServiceLabel(
  serviceId?: string | null,
  services: AdminServiceRow[] = [],
) {
  if (!serviceId) {
    return 'Service inconnu';
  }

  const service = services.find((item) => item.id === serviceId);

  return service?.title ?? (service ? 'Service sans titre' : 'Service inconnu');
}

export function formatSlugLabel(value: string) {
  if (value.match(/^[a-f0-9]{12,}$/i)) {
    return formatShortId(value);
  }

  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
