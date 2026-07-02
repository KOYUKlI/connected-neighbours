import { useEffect, useMemo, useState } from 'react';
import type { AdminSyncStateRow } from '../api/admin';
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
  IdText,
  formatDate,
  formatNumber,
  getDateThreshold,
  matchesSearch,
  paginateRows,
  sortAdminRows,
} from '../components/ui/AdminList';
import type { AdminSortState } from '../components/ui/AdminList';

type SyncTab = 'clients' | 'history' | 'errors';
type DateFilter = 'all' | '7d' | '30d';

export function SyncPage({ syncStates }: { syncStates: AdminSyncStateRow[] }) {
  const [activeTab, setActiveTab] = useState<SyncTab>('clients');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminSortState | null>(null);
  const successClients = syncStates.filter((syncState) => syncState.status === 'success').length;
  const errorClients = syncStates.filter(
    (syncState) => syncState.status === 'error' || Boolean(syncState.lastError),
  ).length;
  const historyClients = syncStates.filter(hasSyncActivity).length;
  const recentSyncStates = [...syncStates]
    .sort((left, right) => {
      const leftDate = Date.parse(
        left.lastSuccessfulSyncAt ?? left.lastPushAt ?? left.lastPullAt ?? left.updatedAt ?? '',
      );
      const rightDate = Date.parse(
        right.lastSuccessfulSyncAt ?? right.lastPushAt ?? right.lastPullAt ?? right.updatedAt ?? '',
      );

      return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
    })
    .slice(0, 4);

  const statuses = useMemo(
    () =>
      Array.from(new Set(syncStates.map((syncState) => syncState.status).filter(Boolean))).sort(),
    [syncStates],
  );
  const filteredSyncStates = useMemo(() => {
    const threshold = getDateThreshold(dateFilter);

    return syncStates.filter((syncState) => {
      const updatedAt = syncState.updatedAt ? Date.parse(syncState.updatedAt) : null;
      const isError = syncState.status === 'error' || Boolean(syncState.lastError);
      const matchesTab =
        activeTab === 'clients' ||
        (activeTab === 'history' && hasSyncActivity(syncState)) ||
        (activeTab === 'errors' && isError);
      const matchesStatus =
        statusFilter === 'all' || syncState.status === statusFilter;
      const matchesDate =
        threshold === null ||
        (updatedAt !== null && !Number.isNaN(updatedAt) && updatedAt >= threshold);

      return (
        matchesTab &&
        matchesStatus &&
        matchesDate &&
        matchesSearch(
          query,
          syncState.clientId,
          syncState.status,
          syncState.lastError,
        )
      );
    });
  }, [activeTab, dateFilter, query, statusFilter, syncStates]);
  const sortedSyncStates = useMemo(
    () =>
      sortAdminRows(filteredSyncStates, sort, {
        client: (syncState) => syncState.clientId ?? syncState.id ?? '',
        lastSync: (syncState) =>
          parseDateValue(
            syncState.lastSuccessfulSyncAt ??
              syncState.lastPullAt ??
              syncState.lastPushAt ??
              syncState.updatedAt,
          ),
        operations: () => 0,
        source: () => 'JavaFX',
        status: (syncState) => formatSyncStatus(syncState.status),
      }),
    [filteredSyncStates, sort],
  );
  const rows = paginateRows(sortedSyncStates, page, pageSize);

  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
  }, [activeTab, dateFilter, query, statusFilter]);

  function resetFilters() {
    setActiveTab('clients');
    setDateFilter('all');
    setQuery('');
    setStatusFilter('all');
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
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            onClick={() => undefined}
            type="button"
          >
            <span className="text-lg leading-none">↻</span>
            Lancer une synchronisation
          </button>
        }
        description="Surveillez la synchronisation des clients JavaFX en mode hors ligne."
        title="Synchronisation"
      />
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Clients connus" tone="blue" value={syncStates.length} />
        <MetricCard label="Succès" tone="emerald" value={successClients} />
        <MetricCard label="Erreurs" tone="red" value={errorClients} />
        <MetricCard
          label="À surveiller"
          tone="amber"
          value={Math.max(0, syncStates.length - successClients)}
        />
      </div>
      <AdminListTabs
        items={[
          { id: 'clients', label: 'Clients', count: syncStates.length },
          { id: 'history', label: 'Historique', count: historyClients },
          { id: 'errors', label: 'Erreurs', count: errorClients },
        ]}
        onChange={setActiveTab}
        value={activeTab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={setQuery}
          placeholder="Rechercher un client"
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
        <AdminSelect label="Statut" onChange={setStatusFilter} value={statusFilter}>
          <option value="all">Tous les statuts</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {formatSyncStatus(status)}
            </option>
          ))}
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        bulkActions={[
          { label: 'Exporter', onClick: () => undefined },
          { label: 'Relancer sync', onClick: () => undefined },
        ]}
        columns={[
          {
            header: 'Client',
            render: (syncState) => <IdText value={syncState.clientId} />,
            sortKey: 'client',
          },
          {
            header: 'Dernière synchronisation',
            render: (syncState) => (
              <span className="whitespace-nowrap">
                {formatDate(
                  syncState.lastSuccessfulSyncAt ??
                    syncState.lastPullAt ??
                    syncState.lastPushAt ??
                    syncState.updatedAt,
                )}
              </span>
            ),
            sortKey: 'lastSync',
            width: '22%',
          },
          {
            header: 'Statut',
            render: (syncState) => (
              <AdminBadge tone={getSyncStatusTone(syncState.status, syncState.lastError)}>
                {formatSyncStatus(syncState.status)}
              </AdminBadge>
            ),
            sortKey: 'status',
            width: '13%',
          },
          {
            className: 'text-right',
            header: 'Opérations',
            render: () => '0',
            sortKey: 'operations',
            width: '13%',
          },
          {
            header: 'Version ou source',
            render: () => <span className="text-slate-500">JavaFX</span>,
            sortKey: 'source',
            width: '20%',
          },
          {
            header: 'Actions',
            render: (syncState) => (
              <div className="flex items-center justify-end gap-1.5">
                <AdminActionMenu
                  items={[
                    { label: 'Voir le détail', onClick: () => openSyncDetails(syncState) },
                    { label: 'Journal', onClick: () => undefined },
                    { label: 'Relancer', onClick: () => undefined },
                  ]}
                />
                <span className="sr-only">{syncState.id}</span>
              </div>
            ),
            width: '10%',
          },
        ]}
        emptyDescription={
          syncStates.length === 0
            ? 'Les postes JavaFX synchronisés apparaîtront ici.'
            : 'Aucun client ne correspond aux filtres sélectionnés.'
        }
        emptyMessage="Aucun client de synchronisation"
        getRowKey={(syncState, index) => syncState.id ?? syncState.clientId ?? `sync-${index}`}
        onRowClick={openSyncDetails}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={updateSort}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={`${sortedSyncStates.length} clients`}
        tableLabel={getSyncTabLabel(activeTab)}
        total={sortedSyncStates.length}
      />
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] gap-4 max-xl:grid-cols-1">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Journal récent</h2>
              <p className="mt-1 text-sm text-slate-500">
                Dernières traces de synchronisation connues.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {formatNumber(recentSyncStates.length)} entrée(s)
            </span>
          </div>
          {recentSyncStates.length > 0 ? (
            <div className="grid gap-2">
              {recentSyncStates.map((syncState, index) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  key={syncState.id ?? syncState.clientId ?? `sync-log-${index}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {syncState.clientId ?? 'Client inconnu'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(
                        syncState.lastSuccessfulSyncAt ??
                          syncState.lastPushAt ??
                          syncState.lastPullAt ??
                          syncState.updatedAt,
                      )}
                    </p>
                  </div>
                  <AdminBadge tone={getSyncStatusTone(syncState.status, syncState.lastError)}>
                    {formatSyncStatus(syncState.status)}
                  </AdminBadge>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
              Aucun événement de synchronisation à afficher.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Résumé des files d’attente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Vue synthétique des clients connus, calculée depuis les états disponibles.
          </p>
          <div className="mt-4 grid gap-3">
            <QueueSummaryRow label="Clients connus" value={syncStates.length} />
            <QueueSummaryRow label="Synchronisations réussies" value={successClients} tone="emerald" />
            <QueueSummaryRow label="Erreurs à traiter" value={errorClients} tone="red" />
          </div>
        </section>
      </div>
    </section>
  );
}

function openSyncDetails(syncState: AdminSyncStateRow) {
  void syncState.id;
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasSyncActivity(syncState: AdminSyncStateRow) {
  return Boolean(
    syncState.lastPullAt ||
      syncState.lastPushAt ||
      syncState.lastSuccessfulSyncAt,
  );
}

function getSyncTabLabel(tab: SyncTab) {
  const labels: Record<SyncTab, string> = {
    clients: 'Clients',
    errors: 'Erreurs',
    history: 'Historique',
  };

  return labels[tab];
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'amber' | 'blue' | 'emerald' | 'red';
  value: number;
}) {
  const iconClass =
    tone === 'blue'
      ? 'bg-blue-100 text-blue-700'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : tone === 'red'
          ? 'bg-red-100 text-red-700'
          : 'bg-amber-100 text-amber-700';

  const symbol =
    tone === 'blue'
      ? '↻'
      : tone === 'emerald'
        ? '✓'
        : tone === 'red'
          ? '!'
          : '≡';

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold ${iconClass}`}>
        {symbol}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <strong className="mt-1 block text-2xl font-bold text-slate-950">
          {formatNumber(value)}
        </strong>
      </div>
    </div>
  );
}

function formatSyncStatus(status?: string | null) {
  const labels: Record<string, string> = {
    error: 'Erreur',
    idle: 'Inactif',
    success: 'Succès',
  };

  return labels[status ?? ''] ?? status ?? 'Inconnu';
}

function getSyncStatusTone(status?: string | null, error?: string | null) {
  if (status === 'error' || error) {
    return 'red';
  }

  if (status === 'success') {
    return 'emerald';
  }

  return 'slate';
}

function QueueSummaryRow({
  label,
  tone = 'slate',
  value,
}: {
  label: string;
  tone?: 'emerald' | 'red' | 'slate';
  value: number;
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'red'
        ? 'bg-red-500'
        : 'bg-blue-500';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${toneClass}`} />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <strong className="text-sm font-semibold text-slate-950">{formatNumber(value)}</strong>
    </div>
  );
}
