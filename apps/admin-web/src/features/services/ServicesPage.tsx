import { fetchServices } from '../../api/admin';
import type { AdminServiceRow } from '../../api/admin';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { MonoValue } from '../../shared/components/MonoValue';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ValueOrDash } from '../../shared/components/ValueOrDash';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { formatDate, formatNumber } from '../../shared/utils/format';

const columns: TableColumn<AdminServiceRow>[] = [
  { header: 'Titre', render: (row) => <ValueOrDash value={row.title} /> },
  { header: 'Categorie', render: (row) => <ValueOrDash value={row.category} /> },
  { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
  { header: 'Owner', render: (row) => <MonoValue value={row.ownerId} /> },
  { header: 'Quartier', render: (row) => <MonoValue value={row.neighborhoodId} /> },
  {
    header: 'Points',
    render: (row) => formatNumber(row.pricePoints ?? 0),
    className: 'numeric-cell',
  },
  { header: 'Creation', render: (row) => formatDate(row.createdAt) },
];

export function ServicesPage() {
  const { data: services, isLoading, error } = useAdminResource<AdminServiceRow[]>(
    fetchServices,
    [],
  );

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <DataTable columns={columns} emptyMessage="Aucun service recent." rows={services} />
  );
}
