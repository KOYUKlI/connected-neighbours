import { useEffect, useMemo, useState } from 'react';
import type { AdminServiceRow, AdminUserRow } from '../api/admin';
import type { NeighborhoodItem } from '../api/neighborhoods';
import {
  AdminActionMenu,
  AdminBadge,
  AdminListHeader,
  AdminListTable,
  AdminListTabs,
  AdminListToolbar,
  AdminResetButton,
  AdminSearchInput,
  AdminSelect,
  ValueText,
  formatDate,
  formatNumber,
  getDateThreshold,
  matchesSearch,
  paginateRows,
  sortAdminRows,
} from '../components/ui/AdminList';
import type { AdminSortState } from '../components/ui/AdminList';
import {
  formatNeighborhoodLabel,
  formatUserLabel,
} from '../utils/adminLabels';

type ServiceTab = 'all' | 'draft' | 'published' | 'completed' | 'cancelled';
type DateFilter = 'all' | '7d' | '30d';

const ACTIVE_STATUSES = [
  'published',
  'application_received',
  'candidate_selected',
  'contract_pending',
  'awaiting_signatures',
  'contract_active',
];

export function ServicesListPage({
  neighborhoods,
  services,
  users,
}: {
  neighborhoods: NeighborhoodItem[];
  services: AdminServiceRow[];
  users: AdminUserRow[];
}) {
  const [activeTab, setActiveTab] = useState<ServiceTab>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminSortState | null>(null);

  const filteredServices = useMemo(() => {
    const threshold = getDateThreshold(dateFilter);

    return services.filter((service) => {
      const status = service.status ?? '';
      const createdAt = service.createdAt ? Date.parse(service.createdAt) : null;
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'published' && ACTIVE_STATUSES.includes(status)) ||
        (activeTab !== 'published' && status === activeTab);
      const matchesNeighborhood =
        neighborhoodFilter === 'all' ||
        service.neighborhoodId === neighborhoodFilter ||
        formatNeighborhoodLabel(service.neighborhoodId, neighborhoods) ===
          formatNeighborhoodLabel(neighborhoodFilter, neighborhoods);
      const matchesDate =
        threshold === null ||
        (createdAt !== null && !Number.isNaN(createdAt) && createdAt >= threshold);

      return (
        matchesTab &&
        matchesNeighborhood &&
        matchesDate &&
        matchesSearch(
          query,
          service.title,
          service.category,
          formatNeighborhoodLabel(service.neighborhoodId, neighborhoods),
          service.status,
          formatUserLabel(service.ownerId, users),
        )
      );
    });
  }, [activeTab, dateFilter, neighborhoodFilter, neighborhoods, query, services, users]);
  const sortedServices = useMemo(
    () =>
      sortAdminRows(filteredServices, sort, {
        createdAt: (service) => parseDateValue(service.createdAt),
        neighborhood: (service) =>
          formatNeighborhoodLabel(service.neighborhoodId, neighborhoods),
        owner: (service) => formatUserLabel(service.ownerId, users),
        points: (service) => service.pricePoints ?? 0,
        service: (service) => service.title ?? service.category ?? '',
        status: (service) => formatServiceStatus(service.status),
      }),
    [filteredServices, neighborhoods, sort, users],
  );
  const rows = paginateRows(sortedServices, page, pageSize);

  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
  }, [activeTab, dateFilter, neighborhoodFilter, query]);

  function resetFilters() {
    setActiveTab('all');
    setDateFilter('all');
    setNeighborhoodFilter('all');
    setQuery('');
    setPage(1);
  }

  function updateSort(nextSort: AdminSortState) {
    setSort(nextSort);
    setPage(1);
    setSelectedRowKeys([]);
  }

  return (
    <section className="grid gap-4">
      <AdminListHeader
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            type="button"
          >
            Exporter
          </button>
        }
        description="Consultez les services créés par les habitants et leur avancement."
        title="Services"
      />
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: services.length },
          {
            id: 'draft',
            label: 'Brouillon',
            count: services.filter((service) => service.status === 'draft').length,
          },
          {
            id: 'published',
            label: 'Publiés',
            count: services.filter((service) =>
              ACTIVE_STATUSES.includes(service.status ?? ''),
            ).length,
          },
          {
            id: 'completed',
            label: 'Terminés',
            count: services.filter((service) => service.status === 'completed').length,
          },
          {
            id: 'cancelled',
            label: 'Annulés',
            count: services.filter((service) => service.status === 'cancelled').length,
          },
        ]}
        onChange={setActiveTab}
        value={activeTab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={setQuery}
          placeholder="Rechercher un service"
          value={query}
        />
        <AdminSelect
          label="Date"
          onChange={(value) => setDateFilter(value as DateFilter)}
          value={dateFilter}
        >
          <option value="all">Toutes les dates</option>
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
        </AdminSelect>
        <AdminSelect
          label="Quartier"
          onChange={setNeighborhoodFilter}
          value={neighborhoodFilter}
        >
          <option value="all">Tous les quartiers</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood.id ?? neighborhood._id ?? neighborhood.slug} value={neighborhood.slug}>
              {formatNeighborhoodLabel(neighborhood.slug, neighborhoods)}
            </option>
          ))}
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        bulkActions={[
          { label: 'Exporter', onClick: () => undefined },
          { label: 'Modérer', onClick: () => undefined },
        ]}
        columns={[
          {
            header: 'Service',
            render: (service) => (
              <div className="flex min-w-0 items-center gap-3">
                <ServiceMark label={service.title ?? service.category} />
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950" title={service.title}>
                    <ValueText value={service.title} />
                  </strong>
                  {service.category ? (
                    <span
                      className="mt-0.5 block truncate text-xs text-slate-500"
                      title={service.category}
                    >
                      {service.category}
                    </span>
                  ) : null}
                </div>
              </div>
            ),
            sortKey: 'service',
            width: '27%',
          },
          {
            header: 'Quartier',
            render: (service) => (
              <span className="block truncate" title={service.neighborhoodId ?? undefined}>
                {formatNeighborhoodLabel(service.neighborhoodId, neighborhoods)}
              </span>
            ),
            sortKey: 'neighborhood',
            width: '14%',
          },
          {
            header: 'Propriétaire',
            render: (service) => (
              <span className="block truncate" title={service.ownerId ?? undefined}>
                {formatUserLabel(service.ownerId, users)}
              </span>
            ),
            sortKey: 'owner',
            width: '15%',
          },
          {
            className: 'text-right whitespace-nowrap',
            header: 'Points',
            render: (service) => formatNumber(service.pricePoints ?? 0),
            sortKey: 'points',
            width: '8%',
          },
          {
            header: 'Statut',
            render: (service) => (
              <AdminBadge tone={getServiceStatusTone(service.status)}>
                {formatServiceStatus(service.status)}
              </AdminBadge>
            ),
            sortKey: 'status',
            width: '12%',
          },
          {
            header: 'Création',
            render: (service) => (
              <span className="whitespace-nowrap">{formatDate(service.createdAt)}</span>
            ),
            sortKey: 'createdAt',
            width: '12%',
          },
          {
            header: 'Actions',
            render: (service) => (
              <div className="flex items-center justify-end gap-1.5">
                <AdminActionMenu
                  items={[
                    { label: 'Voir le détail', onClick: () => openServiceDetails(service) },
                    { label: 'Voir propriétaire', onClick: () => undefined },
                    {
                      disabled: !service.contractId,
                      label: 'Voir contrat lié',
                      onClick: () => undefined,
                    },
                  ]}
                />
                <span className="sr-only">{service.id}</span>
              </div>
            ),
            width: '12%',
          },
        ]}
        emptyDescription={
          services.length === 0
            ? 'Les services créés ou publiés par les habitants apparaîtront ici.'
            : 'Aucun service ne correspond aux filtres sélectionnés.'
        }
        emptyMessage="Aucun service trouvé"
        getRowKey={(service, index) => service.id ?? `service-${index}`}
        onRowClick={openServiceDetails}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={updateSort}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={`${sortedServices.length} services`}
        tableLabel={getServiceTabLabel(activeTab)}
        total={sortedServices.length}
      />
    </section>
  );
}

function openServiceDetails(service: AdminServiceRow) {
  void service.id;
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function ServiceMark({ label }: { label?: string | null }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
      {(label?.trim()[0] ?? 'S').toUpperCase()}
    </span>
  );
}

function getServiceTabLabel(tab: ServiceTab) {
  const labels: Record<ServiceTab, string> = {
    all: 'Tous',
    cancelled: 'Annulés',
    completed: 'Terminés',
    draft: 'Brouillon',
    published: 'Publiés',
  };

  return labels[tab];
}

function formatServiceStatus(status?: string) {
  const labels: Record<string, string> = {
    application_received: 'Candidature reçue',
    awaiting_signatures: 'Signatures',
    cancelled: 'Annulé',
    candidate_selected: 'Candidat choisi',
    completed: 'Terminé',
    contract_active: 'Actif',
    contract_pending: 'Contrat',
    draft: 'Brouillon',
    published: 'Publié',
  };

  return labels[status ?? ''] ?? status ?? 'Inconnu';
}

function getServiceStatusTone(status?: string) {
  if (status === 'completed') {
    return 'emerald';
  }

  if (status === 'cancelled') {
    return 'red';
  }

  if (status === 'draft') {
    return 'slate';
  }

  return 'blue';
}
