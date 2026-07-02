import { useEffect, useMemo, useState } from 'react';
import type { AdminIncidentRow } from '../api/admin';
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
  getDateThreshold,
  matchesSearch,
  paginateRows,
  sortAdminRows,
} from '../components/ui/AdminList';
import type { AdminSortState } from '../components/ui/AdminList';
import { formatNeighborhoodLabel } from '../utils/adminLabels';

type IncidentTab = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
type DateFilter = 'all' | '7d' | '30d';

export function IncidentsListPage({
  incidents,
  neighborhoods,
}: {
  incidents: AdminIncidentRow[];
  neighborhoods: NeighborhoodItem[];
}) {
  const [activeTab, setActiveTab] = useState<IncidentTab>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminSortState | null>(null);

  const severities = useMemo(
    () =>
      Array.from(new Set(incidents.map((incident) => incident.severity).filter(Boolean))).sort(),
    [incidents],
  );
  const filteredIncidents = useMemo(() => {
    const threshold = getDateThreshold(dateFilter);

    return incidents.filter((incident) => {
      const status = incident.status ?? '';
      const createdAt = incident.createdAt ? Date.parse(incident.createdAt) : null;
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'open' && ['reported', 'open'].includes(status)) ||
        (activeTab !== 'open' && status === activeTab);
      const matchesSeverity =
        severityFilter === 'all' || incident.severity === severityFilter;
      const matchesDate =
        threshold === null ||
        (createdAt !== null && !Number.isNaN(createdAt) && createdAt >= threshold);

      return (
        matchesTab &&
        matchesSeverity &&
        matchesDate &&
        matchesSearch(
          query,
          incident.title,
          incident.type,
          incident.severity,
          incident.status,
          formatNeighborhoodLabel(incident.neighborhoodId, neighborhoods),
          incident.source,
          incident.externalId,
        )
      );
    });
  }, [activeTab, dateFilter, incidents, neighborhoods, query, severityFilter]);
  const sortedIncidents = useMemo(
    () =>
      sortAdminRows(filteredIncidents, sort, {
        createdAt: (incident) => parseDateValue(incident.createdAt),
        incident: (incident) => incident.title ?? incident.externalId ?? '',
        neighborhood: (incident) =>
          formatNeighborhoodLabel(incident.neighborhoodId, neighborhoods),
        reporter: () => '',
        severity: (incident) => formatSeverity(incident.severity),
        status: (incident) => formatIncidentStatus(incident.status),
        type: (incident) => incident.type ?? '',
      }),
    [filteredIncidents, neighborhoods, sort],
  );
  const rows = paginateRows(sortedIncidents, page, pageSize);

  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
  }, [activeTab, dateFilter, query, severityFilter]);

  function resetFilters() {
    setActiveTab('all');
    setDateFilter('all');
    setQuery('');
    setSeverityFilter('all');
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
            type="button"
          >
            <span className="text-lg leading-none">+</span>
            Nouvel incident
          </button>
        }
        description="Suivez et gérez les incidents signalés sur la plateforme."
        title="Incidents"
      />
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: incidents.length },
          {
            id: 'open',
            label: 'Ouverts',
            count: incidents.filter((incident) =>
              ['reported', 'open'].includes(incident.status ?? ''),
            ).length,
          },
          {
            id: 'in_progress',
            label: 'En cours',
            count: incidents.filter((incident) => incident.status === 'in_progress').length,
          },
          {
            id: 'resolved',
            label: 'Résolus',
            count: incidents.filter((incident) => incident.status === 'resolved').length,
          },
          {
            id: 'closed',
            label: 'Fermés',
            count: incidents.filter((incident) => incident.status === 'closed').length,
          },
        ]}
        onChange={setActiveTab}
        value={activeTab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={setQuery}
          placeholder="Rechercher un incident"
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
          label="Sévérité"
          onChange={setSeverityFilter}
          value={severityFilter}
        >
          <option value="all">Toutes les sévérités</option>
          {severities.map((severity) => (
            <option key={severity} value={severity}>
              {formatSeverity(severity)}
            </option>
          ))}
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        bulkActions={[
          { label: 'Exporter', onClick: () => undefined },
          { label: 'Marquer résolu', onClick: () => undefined },
        ]}
        columns={[
          {
            header: 'Incident',
            render: (incident) => (
              <div className="min-w-0">
                <strong className="block truncate text-slate-950" title={incident.title}>
                  <ValueText value={incident.title} />
                </strong>
                {incident.externalId ? (
                  <span className="mt-0.5 block truncate text-xs text-blue-600" title={incident.externalId}>
                    {incident.externalId}
                  </span>
                ) : (
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Source {incident.source ?? 'web'}
                  </span>
                )}
              </div>
            ),
            sortKey: 'incident',
            width: '22%',
          },
          {
            header: 'Type',
            render: (incident) => (
              <span className="block truncate" title={incident.type}>
                <ValueText value={incident.type} />
              </span>
            ),
            sortKey: 'type',
            width: '11%',
          },
          {
            header: 'Sévérité',
            render: (incident) => (
              <AdminBadge tone={getSeverityTone(incident.severity)}>
                {formatSeverity(incident.severity)}
              </AdminBadge>
            ),
            sortKey: 'severity',
            width: '10%',
          },
          {
            header: 'Quartier',
            render: (incident) => (
              <span className="block truncate" title={incident.neighborhoodId ?? undefined}>
                {formatNeighborhoodLabel(incident.neighborhoodId, neighborhoods)}
              </span>
            ),
            sortKey: 'neighborhood',
            width: '13%',
          },
          {
            header: 'Reporter',
            render: () => <span className="text-slate-500">—</span>,
            sortKey: 'reporter',
            width: '9%',
          },
          {
            header: 'Statut',
            render: (incident) => (
              <AdminBadge tone={getIncidentStatusTone(incident.status)}>
                {formatIncidentStatus(incident.status)}
              </AdminBadge>
            ),
            sortKey: 'status',
            width: '10%',
          },
          {
            header: 'Création',
            render: (incident) => (
              <span className="whitespace-nowrap">{formatDate(incident.createdAt)}</span>
            ),
            sortKey: 'createdAt',
            width: '12%',
          },
          {
            header: 'Actions',
            render: (incident) => (
              <div className="flex items-center justify-end gap-1.5">
                <AdminActionMenu
                  items={[
                    { label: 'Voir le détail', onClick: () => openIncidentDetails(incident) },
                    { label: 'Résoudre', onClick: () => undefined },
                    { label: 'Fermer', onClick: () => undefined, tone: 'red' },
                  ]}
                />
                <span className="sr-only">{incident.id}</span>
              </div>
            ),
            width: '8%',
          },
        ]}
        emptyDescription={
          incidents.length === 0
            ? 'Les incidents créés par les habitants apparaîtront ici.'
            : 'Aucun incident ne correspond aux filtres sélectionnés.'
        }
        emptyMessage="Aucun incident signalé"
        getRowKey={(incident, index) => incident.id ?? `incident-${index}`}
        onRowClick={openIncidentDetails}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={updateSort}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={`${sortedIncidents.length} incidents`}
        tableLabel={getIncidentTabLabel(activeTab)}
        total={sortedIncidents.length}
      />
    </section>
  );
}

function openIncidentDetails(incident: AdminIncidentRow) {
  void incident.id;
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function getIncidentTabLabel(tab: IncidentTab) {
  const labels: Record<IncidentTab, string> = {
    all: 'Tous',
    closed: 'Fermés',
    in_progress: 'En cours',
    open: 'Ouverts',
    resolved: 'Résolus',
  };

  return labels[tab];
}

function formatIncidentStatus(status?: string) {
  const labels: Record<string, string> = {
    closed: 'Fermé',
    in_progress: 'En cours',
    open: 'Ouvert',
    rejected: 'Rejeté',
    reported: 'Signalé',
    resolved: 'Résolu',
  };

  return labels[status ?? ''] ?? status ?? 'Inconnu';
}

function formatSeverity(severity?: string) {
  const labels: Record<string, string> = {
    critical: 'Critique',
    high: 'Haute',
    low: 'Basse',
    medium: 'Moyenne',
  };

  return labels[severity ?? ''] ?? severity ?? 'Inconnue';
}

function getIncidentStatusTone(status?: string) {
  if (status === 'resolved' || status === 'closed') {
    return 'emerald';
  }

  if (status === 'rejected') {
    return 'red';
  }

  if (status === 'in_progress') {
    return 'blue';
  }

  return 'amber';
}

function getSeverityTone(severity?: string) {
  if (severity === 'critical' || severity === 'high') {
    return 'red';
  }

  if (severity === 'medium') {
    return 'amber';
  }

  return 'emerald';
}
