import { useEffect, useMemo, useState } from 'react';
import type { AdminContractRow, AdminServiceRow, AdminUserRow } from '../api/admin';
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
  formatDate,
  formatNumber,
  formatShortId,
  getDateThreshold,
  matchesSearch,
  paginateRows,
  sortAdminRows,
} from '../components/ui/AdminList';
import type { AdminSortState } from '../components/ui/AdminList';
import {
  formatServiceLabel,
  formatUserLabel,
} from '../utils/adminLabels';

type ContractTab = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';
type DateFilter = 'all' | '7d' | '30d';

export function ContractsListPage({
  contracts,
  services,
  users,
}: {
  contracts: AdminContractRow[];
  services: AdminServiceRow[];
  users: AdminUserRow[];
}) {
  const [activeTab, setActiveTab] = useState<ContractTab>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminSortState | null>(null);

  const filteredContracts = useMemo(() => {
    const threshold = getDateThreshold(dateFilter);

    return contracts.filter((contract) => {
      const status = contract.status ?? '';
      const createdAt = contract.createdAt ? Date.parse(contract.createdAt) : null;
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && ['draft', 'sent'].includes(status)) ||
        (activeTab !== 'pending' && status === activeTab);
      const matchesDate =
        threshold === null ||
        (createdAt !== null && !Number.isNaN(createdAt) && createdAt >= threshold);

      return (
        matchesTab &&
        matchesDate &&
        matchesSearch(
          query,
          contract.id,
          formatServiceLabel(contract.serviceId, services),
          formatUserLabel(contract.requesterId, users),
          formatUserLabel(contract.providerId, users),
          contract.status,
        )
      );
    });
  }, [activeTab, contracts, dateFilter, query, services, users]);
  const sortedContracts = useMemo(
    () =>
      sortAdminRows(filteredContracts, sort, {
        contract: (contract) => formatContractReference(contract.id),
        createdAt: (contract) => parseDateValue(contract.createdAt),
        parties: (contract) =>
          `${formatUserLabel(contract.requesterId, users)} ${formatUserLabel(
            contract.providerId,
            users,
          )}`,
        points: (contract) => contract.pricePoints ?? 0,
        service: (contract) => formatServiceLabel(contract.serviceId, services),
        signatures: (contract) => contract.signedByIds?.length ?? 0,
        status: (contract) => formatContractStatus(contract.status),
      }),
    [filteredContracts, services, sort, users],
  );
  const rows = paginateRows(sortedContracts, page, pageSize);

  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
  }, [activeTab, dateFilter, query]);

  function resetFilters() {
    setActiveTab('all');
    setDateFilter('all');
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
        description="Consultez et gérez l’ensemble des contrats de services."
        title="Contrats"
      />
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: contracts.length },
          {
            id: 'pending',
            label: 'En attente',
            count: contracts.filter((contract) =>
              ['draft', 'sent'].includes(contract.status ?? ''),
            ).length,
          },
          {
            id: 'active',
            label: 'En cours',
            count: contracts.filter((contract) => contract.status === 'active').length,
          },
          {
            id: 'completed',
            label: 'Terminés',
            count: contracts.filter((contract) => contract.status === 'completed').length,
          },
          {
            id: 'cancelled',
            label: 'Annulés',
            count: contracts.filter((contract) => contract.status === 'cancelled').length,
          },
        ]}
        onChange={setActiveTab}
        value={activeTab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={setQuery}
          placeholder="Rechercher un contrat"
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
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        bulkActions={[
          { label: 'Exporter', onClick: () => undefined },
          { label: 'Marquer à vérifier', onClick: () => undefined },
        ]}
        columns={[
          {
            header: 'Contrat',
            render: (contract) => (
              <div className="min-w-0">
                <strong className="block truncate text-slate-950" title={contract.id ?? undefined}>
                  {formatContractReference(contract.id)}
                </strong>
                {contract.applicationId ? (
                  <span className="mt-0.5 block truncate text-xs text-slate-500" title={contract.applicationId}>
                    Candidature {formatShortId(contract.applicationId)}
                  </span>
                ) : null}
              </div>
            ),
            sortKey: 'contract',
            width: '14%',
          },
          {
            header: 'Service',
            render: (contract) => (
              <span className="block truncate" title={contract.serviceId ?? undefined}>
                {formatServiceLabel(contract.serviceId, services)}
              </span>
            ),
            sortKey: 'service',
            width: '18%',
          },
          {
            header: 'Parties',
            render: (contract) => (
              <div className="grid min-w-0 gap-0.5 text-xs">
                <span className="truncate text-slate-700" title={contract.requesterId ?? undefined}>
                  <span className="font-semibold text-slate-500">Demandeur : </span>
                  {formatUserLabel(contract.requesterId, users)}
                </span>
                <span className="truncate text-slate-700" title={contract.providerId ?? undefined}>
                  <span className="font-semibold text-slate-500">Prestataire : </span>
                  {formatUserLabel(contract.providerId, users)}
                </span>
              </div>
            ),
            sortKey: 'parties',
            width: '22%',
          },
          {
            className: 'text-right whitespace-nowrap',
            header: 'Points',
            render: (contract) => formatNumber(contract.pricePoints ?? 0),
            sortKey: 'points',
            width: '7%',
          },
          {
            className: 'text-right whitespace-nowrap',
            header: 'Signatures',
            render: (contract) => `${contract.signedByIds?.length ?? 0}/2`,
            sortKey: 'signatures',
            width: '9%',
          },
          {
            header: 'Statut',
            render: (contract) => (
              <AdminBadge tone={getContractStatusTone(contract.status)}>
                {formatContractStatus(contract.status)}
              </AdminBadge>
            ),
            sortKey: 'status',
            width: '10%',
          },
          {
            header: 'Création',
            render: (contract) => (
              <span className="whitespace-nowrap">{formatDate(contract.createdAt)}</span>
            ),
            sortKey: 'createdAt',
            width: '11%',
          },
          {
            header: 'Actions',
            render: (contract) => (
              <div className="flex items-center justify-end gap-1.5">
                <AdminActionMenu
                  items={[
                    { label: 'Voir le détail', onClick: () => openContractDetails(contract) },
                    { label: 'Voir signatures', onClick: () => undefined },
                    { label: 'Voir service lié', onClick: () => undefined },
                  ]}
                />
                <span className="sr-only">{contract.id}</span>
              </div>
            ),
            width: '9%',
          },
        ]}
        emptyDescription={
          contracts.length === 0
            ? 'Les contrats générés depuis les candidatures apparaîtront ici.'
            : 'Aucun contrat ne correspond aux filtres sélectionnés.'
        }
        emptyMessage="Aucun contrat trouvé"
        getRowKey={(contract, index) => contract.id ?? `contract-${index}`}
        onRowClick={openContractDetails}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={updateSort}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={`${sortedContracts.length} contrats`}
        tableLabel={getContractTabLabel(activeTab)}
        total={sortedContracts.length}
      />
    </section>
  );
}

function openContractDetails(contract: AdminContractRow) {
  void contract.id;
}

function formatContractReference(id?: string | null) {
  if (!id) {
    return 'Contrat inconnu';
  }

  return `CTR-${id.slice(-6).toUpperCase()}`;
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function getContractTabLabel(tab: ContractTab) {
  const labels: Record<ContractTab, string> = {
    active: 'En cours',
    all: 'Tous',
    cancelled: 'Annulés',
    completed: 'Terminés',
    pending: 'En attente',
  };

  return labels[tab];
}

function formatContractStatus(status?: string) {
  const labels: Record<string, string> = {
    active: 'En cours',
    cancelled: 'Annulé',
    completed: 'Terminé',
    disputed: 'Litige',
    draft: 'Brouillon',
    sent: 'Envoyé',
  };

  return labels[status ?? ''] ?? status ?? 'Inconnu';
}

function getContractStatusTone(status?: string) {
  if (status === 'completed') {
    return 'emerald';
  }

  if (status === 'cancelled' || status === 'disputed') {
    return 'red';
  }

  if (status === 'active') {
    return 'blue';
  }

  return 'amber';
}
