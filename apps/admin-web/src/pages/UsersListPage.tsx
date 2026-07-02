import { useEffect, useMemo, useState } from 'react';
import type { AdminUserRow } from '../api/admin';
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
  getInitials,
  matchesSearch,
  paginateRows,
  sortAdminRows,
} from '../components/ui/AdminList';
import type { AdminSortState } from '../components/ui/AdminList';
import { formatNeighborhoodLabel } from '../utils/adminLabels';

type UserTab = 'all' | 'resident' | 'moderator' | 'admin';

export function UsersListPage({
  neighborhoods,
  users,
}: {
  neighborhoods: NeighborhoodItem[];
  users: AdminUserRow[];
}) {
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminSortState | null>(null);

  const neighborhoodOptions = useMemo(() => {
    const knownNeighborhoods = neighborhoods.map((neighborhood) => ({
      label: formatNeighborhoodLabel(neighborhood.id ?? neighborhood._id ?? neighborhood.slug, neighborhoods),
      value: neighborhood.id ?? neighborhood._id ?? neighborhood.slug,
    }));
    const missingNeighborhoods = users
      .map((user) => user.neighborhoodId)
      .filter((neighborhoodId): neighborhoodId is string => Boolean(neighborhoodId))
      .filter(
        (neighborhoodId) =>
          !knownNeighborhoods.some(
            (neighborhood) =>
              neighborhood.value === neighborhoodId ||
              formatNeighborhoodLabel(neighborhood.value, neighborhoods) ===
                formatNeighborhoodLabel(neighborhoodId, neighborhoods),
          ),
      )
      .map((neighborhoodId) => ({
        label: formatNeighborhoodLabel(neighborhoodId, neighborhoods),
        value: neighborhoodId,
      }));

    return [...knownNeighborhoods, ...missingNeighborhoods].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }, [neighborhoods, users]);
  const filteredUsers = useMemo(
    () => {
      return users.filter((user) => {
        const matchesTab = activeTab === 'all' || user.role === activeTab;
        const matchesNeighborhood =
          neighborhoodFilter === 'all' ||
          user.neighborhoodId === neighborhoodFilter ||
          formatNeighborhoodLabel(user.neighborhoodId, neighborhoods) ===
            formatNeighborhoodLabel(neighborhoodFilter, neighborhoods);

        return (
          matchesTab &&
          matchesNeighborhood &&
          matchesSearch(
            query,
            user.displayName,
            user.email,
            user.role,
            formatNeighborhoodLabel(user.neighborhoodId, neighborhoods),
          )
        );
      });
    },
    [activeTab, neighborhoodFilter, neighborhoods, query, users],
  );
  const sortedUsers = useMemo(
    () =>
      sortAdminRows(filteredUsers, sort, {
        neighborhood: (user) => formatNeighborhoodLabel(user.neighborhoodId, neighborhoods),
        role: (user) => formatRole(user.role),
        status: () => 'Actif',
        user: (user) => user.displayName ?? user.email ?? '',
        balance: (user) => user.pointsBalance ?? 0,
      }),
    [filteredUsers, neighborhoods, sort],
  );
  const rows = paginateRows(sortedUsers, page, pageSize);

  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
  }, [activeTab, neighborhoodFilter, query]);

  function resetFilters() {
    setActiveTab('all');
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
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            type="button"
          >
            <span className="text-lg leading-none">+</span>
            Ajouter un utilisateur
          </button>
        }
        description="Gérez les comptes et les accès des utilisateurs de la plateforme."
        title="Utilisateurs"
      />
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: users.length },
          {
            id: 'resident',
            label: 'Habitants',
            count: users.filter((user) => user.role === 'resident').length,
          },
          {
            id: 'moderator',
            label: 'Modérateurs',
            count: users.filter((user) => user.role === 'moderator').length,
          },
          {
            id: 'admin',
            label: 'Admins',
            count: users.filter((user) => user.role === 'admin').length,
          },
        ]}
        onChange={setActiveTab}
        value={activeTab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={setQuery}
          placeholder="Rechercher un utilisateur"
          value={query}
        />
        <AdminSelect
          label="Quartier"
          onChange={setNeighborhoodFilter}
          value={neighborhoodFilter}
        >
          <option value="all">Tous les quartiers</option>
          {neighborhoodOptions.map((neighborhood) => (
            <option key={neighborhood.value} value={neighborhood.value}>
              {neighborhood.label}
            </option>
          ))}
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        bulkActions={[
          { label: 'Exporter', onClick: () => undefined },
          { label: 'Désactiver', onClick: () => undefined, tone: 'red' },
        ]}
        columns={[
          {
            header: 'Utilisateur',
            render: (user) => (
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {getInitials(user.displayName ?? user.email)}
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950" title={user.displayName ?? user.email}>
                    <ValueText value={user.displayName ?? user.email} />
                  </strong>
                  <span className="mt-0.5 block truncate text-xs text-slate-500" title={user.email}>
                    <ValueText value={user.email} />
                  </span>
                </div>
              </div>
            ),
            sortKey: 'user',
            width: '28%',
          },
          {
            header: 'Rôle',
            render: (user) => (
              <AdminBadge tone={getRoleTone(user.role)}>{formatRole(user.role)}</AdminBadge>
            ),
            sortKey: 'role',
            width: '12%',
          },
          {
            header: 'Quartier',
            render: (user) => (
              <span className="block truncate" title={user.neighborhoodId ?? undefined}>
                {formatNeighborhoodLabel(user.neighborhoodId, neighborhoods)}
              </span>
            ),
            sortKey: 'neighborhood',
            width: '16%',
          },
          {
            className: 'text-right',
            header: 'Solde',
            render: (user) => formatNumber(user.pointsBalance ?? 0),
            sortKey: 'balance',
            width: '8%',
          },
          {
            header: 'Statut',
            render: (user) => (
              <div className="grid gap-0.5">
                <AdminBadge tone="emerald">Actif</AdminBadge>
                <span className="text-xs text-slate-500">
                  Inscrit {formatDate(user.createdAt)}
                </span>
              </div>
            ),
            sortKey: 'status',
            width: '17%',
          },
          {
            header: 'Actions',
            render: (user) => (
              <div className="flex items-center justify-end gap-1.5">
                <AdminActionMenu
                  items={[
                    { label: 'Voir profil', onClick: () => openUserProfile(user) },
                    { label: 'Changer rôle', onClick: () => undefined },
                    { label: 'Désactiver', onClick: () => undefined, tone: 'red' },
                  ]}
                />
                <span className="sr-only">{user.id}</span>
              </div>
            ),
            width: '9%',
          },
        ]}
        emptyDescription={
          users.length === 0
            ? 'Les comptes créés sur la plateforme apparaîtront ici.'
            : 'Aucun compte ne correspond aux filtres sélectionnés.'
        }
        emptyMessage={
          users.length === 0
            ? 'Aucun utilisateur trouvé'
            : 'Aucun utilisateur ne correspond aux filtres'
        }
        getRowKey={(user, index) => user.id ?? user.email ?? `user-${index}`}
        onRowClick={openUserProfile}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={updateSort}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={`${sortedUsers.length} utilisateurs`}
        tableLabel={getUserTabLabel(activeTab)}
        total={sortedUsers.length}
      />
    </section>
  );
}

function openUserProfile(user: AdminUserRow) {
  void user.id;
}

function getUserTabLabel(tab: UserTab) {
  const labels: Record<UserTab, string> = {
    admin: 'Admins',
    all: 'Tous',
    moderator: 'Modérateurs',
    resident: 'Habitants',
  };

  return labels[tab];
}

function formatRole(role?: string) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    moderator: 'Modérateur',
    resident: 'Habitant',
  };

  return labels[role ?? ''] ?? role ?? 'Inconnu';
}

function getRoleTone(role?: string) {
  if (role === 'admin') {
    return 'purple';
  }

  if (role === 'moderator') {
    return 'blue';
  }

  return 'slate';
}
