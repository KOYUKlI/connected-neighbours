import { ApiError } from '../api/client';

export function getFriendlyError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous pour continuer.';
  if (error.status === 403) return 'Vous n’avez pas l’autorisation d’effectuer cette action.';
  if (error.status === 404) return 'La ressource demandée n’est plus disponible.';
  if (/own service|propre service|propre annonce/i.test(error.message)) return 'Vous ne pouvez pas candidater à votre propre annonce.';
  if (/already|déjà/i.test(error.message)) return 'Cette action a déjà été effectuée.';
  return fallback;
}
