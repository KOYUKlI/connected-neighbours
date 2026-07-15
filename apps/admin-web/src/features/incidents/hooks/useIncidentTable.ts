import { fetchIncidents } from '../../../api/admin';
import type { AdminIncidentRow } from '../../../api/admin';
import { useAdminResource } from '../../../shared/hooks/useAdminResource';

export function useIncidentTable() {
  const { data: incidents, isLoading, error } = useAdminResource<AdminIncidentRow[]>(
    fetchIncidents,
    [],
  );

  return { incidents, isLoading, error };
}
