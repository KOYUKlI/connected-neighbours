import { fetchUsers } from '../../api/admin';
import type { AdminUserRow } from '../../api/admin';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { MonoValue } from '../../shared/components/MonoValue';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ValueOrDash } from '../../shared/components/ValueOrDash';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { formatNumber } from '../../shared/utils/format';

const columns: TableColumn<AdminUserRow>[] = [
  { header: 'Email', render: (row) => <ValueOrDash value={row.email} /> },
  { header: 'Nom', render: (row) => <ValueOrDash value={row.displayName} /> },
  { header: 'Role', render: (row) => <StatusBadge value={row.role} /> },
  { header: 'Quartier', render: (row) => <MonoValue value={row.neighborhoodId} /> },
  {
    header: 'Solde',
    render: (row) => formatNumber(row.pointsBalance ?? 0),
    className: 'numeric-cell',
  },
  {
    header: 'Reserve',
    render: (row) => formatNumber(row.reservedPoints ?? 0),
    className: 'numeric-cell',
  },
];

export function UsersPage() {
  const { data: users, isLoading, error } = useAdminResource<AdminUserRow[]>(
    fetchUsers,
    [],
  );

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <DataTable columns={columns} emptyMessage="Aucun utilisateur recent." rows={users} />
  );
}
