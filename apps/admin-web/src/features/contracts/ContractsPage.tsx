import { fetchContracts } from '../../api/admin';
import type { AdminContractRow } from '../../api/admin';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { MonoValue } from '../../shared/components/MonoValue';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { formatDate, formatNumber } from '../../shared/utils/format';

const columns: TableColumn<AdminContractRow>[] = [
  { header: 'Service', render: (row) => <MonoValue value={row.serviceId} /> },
  { header: 'Requester', render: (row) => <MonoValue value={row.requesterId} /> },
  { header: 'Provider', render: (row) => <MonoValue value={row.providerId} /> },
  {
    header: 'Points',
    render: (row) => formatNumber(row.pricePoints ?? 0),
    className: 'numeric-cell',
  },
  { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
  {
    header: 'Signatures',
    render: (row) => `${row.signedByIds?.length ?? 0}/2`,
    className: 'numeric-cell',
  },
  { header: 'Creation', render: (row) => formatDate(row.createdAt) },
];

export function ContractsPage() {
  const { data: contracts, isLoading, error } = useAdminResource<AdminContractRow[]>(
    fetchContracts,
    [],
  );

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <DataTable columns={columns} emptyMessage="Aucun contrat recent." rows={contracts} />
  );
}
