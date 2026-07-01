import { apiRequest } from './client';

export type RgpdExport = Record<string, unknown>;

export function exportRgpdData() {
  return apiRequest<RgpdExport>('/api/rgpd/export');
}
