import { fetchSyncStates } from '../../api/admin';
import type { AdminSyncStateRow } from '../../api/admin';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { MonoValue } from '../../shared/components/MonoValue';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ValueOrDash } from '../../shared/components/ValueOrDash';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { formatDate } from '../../shared/utils/format';

const columns: TableColumn<AdminSyncStateRow>[] = [
  { header: 'Client', render: (row) => <MonoValue value={row.clientId} /> },
  { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
  { header: 'Dernier pull', render: (row) => formatDate(row.lastPullAt) },
  { header: 'Dernier push', render: (row) => formatDate(row.lastPushAt) },
  {
    header: 'Dernier succes',
    render: (row) => formatDate(row.lastSuccessfulSyncAt),
  },
  { header: 'Erreur', render: (row) => <ValueOrDash value={row.lastError} /> },
];

export function SyncPage() {
  const { data: syncStates, isLoading, error } = useAdminResource<AdminSyncStateRow[]>(
    fetchSyncStates,
    [],
  );

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun client de synchronisation connu."
      rows={syncStates}
    />
  );
}
