import type { RgpdExport } from '../../api/rgpd';
import { formatDate, formatNumber } from '../../shared/utils/format';

export const rgpdSectionLabels: Record<string, string> = {
  exportedAt: 'Date d’export',
  user: 'Profil utilisateur',
  services: 'Services créés',
  applicationsAsApplicant: 'Mes candidatures envoyées',
  applicationsAsOwner: 'Candidatures reçues',
  contracts: 'Contrats liés',
  pointTransactions: 'Transactions de points',
  incidents: 'Incidents signalés',
  alerts: 'Alertes liées',
  syncOperations: 'Opérations de synchronisation',
  documents: 'Documents',
};

const rgpdSectionOrder = [
  'exportedAt',
  'user',
  'services',
  'applicationsAsApplicant',
  'applicationsAsOwner',
  'contracts',
  'pointTransactions',
  'incidents',
  'alerts',
  'syncOperations',
  'documents',
] as const;

export function getRgpdSummarySections(exportData: RgpdExport) {
  const knownSections = rgpdSectionOrder
    .filter((key) => key in exportData)
    .map((key) => [key, exportData[key]] as const);
  const extraSections = Object.entries(exportData).filter(
    ([key]) => !rgpdSectionOrder.includes(key as (typeof rgpdSectionOrder)[number]),
  );

  return [...knownSections, ...extraSections];
}

export function formatRgpdSectionValue(key: string, value: unknown) {
  if (key === 'exportedAt') {
    return formatUnknownDate(value);
  }

  if (key === 'user') {
    return value ? 'Profil exporté' : 'Profil absent';
  }

  if (Array.isArray(value)) {
    return formatElementCount(value.length);
  }

  return String(countSectionItems(value));
}

export function formatRgpdSectionDetail(key: string, value: unknown) {
  if (key === 'exportedAt') {
    return 'Date de génération de l’export';
  }

  if (key === 'user') {
    return 'Données principales du compte';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? 'Liste exportée' : 'Aucun élément';
  }

  return countSectionItems(value) > 0 ? 'Données présentes' : 'Aucun élément';
}

function formatUnknownDate(value: unknown) {
  if (typeof value === 'string' || value instanceof Date) {
    return formatDate(value);
  }

  return '-';
}

function formatElementCount(count: number) {
  if (count === 0) {
    return 'Aucun élément';
  }

  return `${formatNumber(count)} élément(s)`;
}

function countSectionItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length;
  }

  return value === undefined || value === null ? 0 : 1;
}
