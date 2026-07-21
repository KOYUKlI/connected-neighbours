import type { ServiceStatus } from '../../api/services';
import type { IconName } from '../../components/ui/Icon';

export const categoryPresentation: Record<string, { icon: IconName; label: string; surface: string }> = {
  animals: { icon: 'paw', label: 'Animaux', surface: 'bg-rose-50 text-rose-700' },
  animaux: { icon: 'paw', label: 'Animaux', surface: 'bg-rose-50 text-rose-700' },
  bricolage: { icon: 'wrench', label: 'Bricolage', surface: 'bg-amber-50 text-amber-700' },
  education: { icon: 'book', label: 'Cours', surface: 'bg-blue-50 text-blue-700' },
  informatique: { icon: 'monitor', label: 'Informatique', surface: 'bg-violet-50 text-violet-700' },
  jardinage: { icon: 'leaf', label: 'Jardinage', surface: 'bg-emerald-50 text-emerald-700' },
  mobilité: { icon: 'services', label: 'Mobilité', surface: 'bg-cyan-50 text-cyan-700' },
  tutoring: { icon: 'book', label: 'Cours', surface: 'bg-blue-50 text-blue-700' },
};

export function getCategoryPresentation(category: string) {
  const key = category.trim().toLocaleLowerCase('fr-FR');
  return categoryPresentation[key] ?? {
    icon: 'services' as IconName,
    label: category || 'Service',
    surface: 'bg-slate-100 text-slate-700',
  };
}

export function getStatusTone(status: ServiceStatus) {
  if (['completed', 'contract_active', 'published'].includes(status)) return 'success' as const;
  if (['cancelled', 'disputed'].includes(status)) return 'danger' as const;
  if (['application_received', 'awaiting_signatures', 'candidate_selected', 'contract_pending'].includes(status)) return 'warning' as const;
  return 'neutral' as const;
}
