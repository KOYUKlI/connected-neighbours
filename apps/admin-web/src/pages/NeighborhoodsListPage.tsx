import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type NeighborhoodStatus = 'active' | 'archived';

type MockNeighborhood = {
  id: string;
  name: string;
  city: string;
  postalCode: string;
  residents: number;
  services: number;
  status: NeighborhoodStatus;
  updatedAt: string;
};

const neighborhoods: MockNeighborhood[] = [
  {
    id: 'centre-ville',
    name: 'Centre-ville',
    city: 'Centre-ville',
    postalCode: '1000',
    residents: 8450,
    services: 6,
    status: 'active',
    updatedAt: '27 mai 2024, 10:30',
  },
  {
    id: 'les-jardins',
    name: 'Les Jardins',
    city: 'Les Jardins',
    postalCode: '1001',
    residents: 5230,
    services: 5,
    status: 'active',
    updatedAt: '24 mai 2024, 14:22',
  },
  {
    id: 'beau-soleil',
    name: 'Beau Soleil',
    city: 'Beau Soleil',
    postalCode: '1002',
    residents: 3980,
    services: 4,
    status: 'active',
    updatedAt: '23 mai 2024, 09:15',
  },
  {
    id: 'le-parc',
    name: 'Le Parc',
    city: 'Le Parc',
    postalCode: '1003',
    residents: 2750,
    services: 3,
    status: 'active',
    updatedAt: '21 mai 2024, 16:45',
  },
  {
    id: 'riviera',
    name: 'Riviera',
    city: 'Riviera',
    postalCode: '1004',
    residents: 4120,
    services: 4,
    status: 'active',
    updatedAt: '20 mai 2024, 11:05',
  },
  {
    id: 'montagne-verte',
    name: 'Montagne Verte',
    city: 'Montagne Verte',
    postalCode: '1005',
    residents: 2980,
    services: 3,
    status: 'active',
    updatedAt: '18 mai 2024, 13:50',
  },
  {
    id: 'saint-michel',
    name: 'Saint-Michel',
    city: 'Saint-Michel',
    postalCode: '1006',
    residents: 6210,
    services: 6,
    status: 'active',
    updatedAt: '17 mai 2024, 08:40',
  },
  {
    id: 'les-acacias',
    name: 'Les Acacias',
    city: 'Les Acacias',
    postalCode: '1007',
    residents: 1950,
    services: 2,
    status: 'active',
    updatedAt: '15 mai 2024, 15:30',
  },
  {
    id: 'la-plaine',
    name: 'La Plaine',
    city: 'La Plaine',
    postalCode: '1008',
    residents: 3410,
    services: 3,
    status: 'active',
    updatedAt: '14 mai 2024, 10:12',
  },
  {
    id: 'bellevue',
    name: 'Bellevue',
    city: 'Bellevue',
    postalCode: '1009',
    residents: 4870,
    services: 5,
    status: 'archived',
    updatedAt: '10 mai 2024, 17:25',
  },
  {
    id: 'nord',
    name: 'Nord',
    city: 'Nord',
    postalCode: '1010',
    residents: 2140,
    services: 2,
    status: 'archived',
    updatedAt: '7 mai 2024, 12:11',
  },
  {
    id: 'port-neuf',
    name: 'Port Neuf',
    city: 'Port Neuf',
    postalCode: '1011',
    residents: 3670,
    services: 4,
    status: 'active',
    updatedAt: '4 mai 2024, 09:45',
  },
];

const numberFormatter = new Intl.NumberFormat('fr-FR');

type NeighborhoodsListPageProps = {
  children?: ReactNode;
  onAdd?: () => void;
  onArchive?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
};

export function NeighborhoodsListPage({
  onAdd,
  onArchive,
  onEdit,
  onView,
}: NeighborhoodsListPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NeighborhoodStatus>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | NeighborhoodStatus>('all');
  const [page, setPage] = useState(1);

  const cities = useMemo(
    () => Array.from(new Set(neighborhoods.map((neighborhood) => neighborhood.city))).sort(),
    [],
  );
  const filteredRows = neighborhoods.filter((neighborhood) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [neighborhood.name, neighborhood.city, neighborhood.postalCode]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesTab = activeTab === 'all' || neighborhood.status === activeTab;
    const matchesStatus = statusFilter === 'all' || neighborhood.status === statusFilter;
    const matchesCity = cityFilter === 'all' || neighborhood.city === cityFilter;

    return matchesQuery && matchesTab && matchesStatus && matchesCity;
  });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  function resetFilters() {
    setQuery('');
    setStatusFilter('all');
    setCityFilter('all');
    setActiveTab('all');
    setPage(1);
  }

  function updateTab(nextTab: 'all' | NeighborhoodStatus) {
    setActiveTab(nextTab);
    setPage(1);
  }

  return (
    <section className="grid gap-4">
      <div className="flex min-h-20 items-center justify-between gap-5 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[2rem] font-bold leading-tight text-slate-950">
            Quartiers
          </h1>
          <p className="mt-1.5 text-base text-slate-500">
            Gérez les quartiers et leurs informations principales.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          onClick={onAdd}
          type="button"
        >
          <span className="text-lg leading-none">+</span>
          Ajouter un quartier
        </button>
      </div>

      <div className="flex h-10 flex-wrap items-center gap-7 border-b border-slate-200">
        <TabButton
          active={activeTab === 'all'}
          count={neighborhoods.length}
          label="Tous"
          onClick={() => updateTab('all')}
        />
        <TabButton
          active={activeTab === 'active'}
          count={neighborhoods.filter((neighborhood) => neighborhood.status === 'active').length}
          label="Actifs"
          onClick={() => updateTab('active')}
        />
        <TabButton
          active={activeTab === 'archived'}
          count={neighborhoods.filter((neighborhood) => neighborhood.status === 'archived').length}
          label="Archivés"
          onClick={() => updateTab('archived')}
        />
      </div>

      <div className="grid grid-cols-[minmax(300px,1fr)_210px_260px_auto] items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1">
        <label className="min-w-0">
          <span className="sr-only">Recherche</span>
          <div className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
            <SearchIcon />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un quartier"
              type="search"
              value={query}
            />
          </div>
        </label>
        <label className="min-w-0">
          <span className="sr-only">Date</span>
          <button
            className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-600"
            type="button"
          >
            Toutes les dates
            <span className="text-slate-400">⌄</span>
          </button>
        </label>
        <FilterSelect
          label="Ville et statut"
          onChange={(value) => {
            const [nextCity, nextStatus] = value.split('|') as [string, 'all' | NeighborhoodStatus];
            setCityFilter(nextCity);
            setStatusFilter(nextStatus);
            setPage(1);
          }}
          value={`${cityFilter}|${statusFilter}`}
        >
          <option value="all|all">Toutes les villes et statuts</option>
          {cities.map((city) => (
            <option key={`${city}-all`} value={`${city}|all`}>
              {city} · tous
            </option>
          ))}
          <option value="all|active">Tous · actifs</option>
          <option value="all|archived">Tous · archivés</option>
        </FilterSelect>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          onClick={resetFilters}
          type="button"
        >
          <span className="text-base leading-none">↻</span>
          Réinitialiser
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-3">
            <strong className="text-sm font-semibold text-slate-950">Tous</strong>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium text-slate-500">
              {filteredRows.length} quartiers
            </span>
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
            type="button"
            aria-label="Menu table"
          >
            ⋮
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[1050px] border-collapse text-sm">
            <thead>
              <tr className="h-10 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-12 px-4 py-2">
                  <Checkbox />
                </th>
                <SortableHeader label="Nom" />
                <SortableHeader label="Ville" />
                <SortableHeader label="Code postal" />
                <SortableHeader label="Habitants" />
                <SortableHeader label="Services" />
                <SortableHeader label="Statut" />
                <SortableHeader label="Dernière mise à jour" />
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map((neighborhood) => (
                <tr className="h-[54px] text-slate-700 hover:bg-slate-50/80" key={neighborhood.id}>
                  <td className="px-4 py-2">
                    <Checkbox />
                  </td>
                  <td className="px-4 py-2 font-semibold text-slate-950">{neighborhood.name}</td>
                  <td className="px-4 py-2">{neighborhood.city}</td>
                  <td className="px-4 py-2">{neighborhood.postalCode}</td>
                  <td className="px-4 py-2">{numberFormatter.format(neighborhood.residents)}</td>
                  <td className="px-4 py-2">{neighborhood.services}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={neighborhood.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">{neighborhood.updatedAt}</td>
                  <td className="px-4 py-2">
                    <div className="flex min-w-max items-center gap-2">
                      <ActionButton onClick={() => onView?.(neighborhood.id)} tone="neutral">
                        Voir
                      </ActionButton>
                      <ActionButton onClick={() => onEdit?.(neighborhood.id)} tone="blue">
                        Modifier
                      </ActionButton>
                      <ActionButton onClick={() => onArchive?.(neighborhood.id)} tone="red">
                        Archiver
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <span>Afficher</span>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700" type="button">
              10
              <span className="ml-2 text-slate-400">⌄</span>
            </button>
            <span>
              {filteredRows.length === 0 ? '0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredRows.length)}`} sur {filteredRows.length} quartiers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PaginationButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              ‹
            </PaginationButton>
            {Array.from({ length: pageCount }).map((_, index) => (
              <PaginationButton
                active={page === index + 1}
                key={index + 1}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </PaginationButton>
            ))}
            <PaginationButton disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
              ›
            </PaginationButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-2 border-b-2 px-1 text-sm font-medium transition ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-950'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function SortableHeader({ label }: { label: string }) {
  return (
    <th className="px-4 py-2">
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-slate-400">⌄</span>
      </span>
    </th>
  );
}

function Checkbox() {
  return <span className="block h-4 w-4 rounded border border-slate-300 bg-white" />;
}

function StatusBadge({ status }: { status: NeighborhoodStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
        status === 'active'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {status === 'active' ? 'Actif' : 'Archivé'}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone: 'blue' | 'neutral' | 'red';
}) {
  const className =
    tone === 'blue'
      ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
      : tone === 'red'
        ? 'border-red-200 text-red-600 hover:bg-red-50'
        : 'border-slate-200 text-slate-600 hover:bg-slate-50';

  return (
    <button
      className={`inline-flex h-7 items-center whitespace-nowrap rounded-md border bg-white px-2 text-xs font-medium transition ${className}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PaginationButton({
  active = false,
  children,
  disabled = false,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m21 21-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}
