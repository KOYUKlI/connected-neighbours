import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

export type AdminListTab<T extends string> = {
  id: T;
  label: string;
  count: number;
};

export type AdminListColumn<T> = {
  className?: string;
  header: string;
  render: (row: T) => ReactNode;
  sortKey?: string;
  width?: string;
};

export type AdminBulkAction = {
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  tone?: 'neutral' | 'red';
};

export type AdminSortDirection = 'asc' | 'desc';

export type AdminSortState = {
  direction: AdminSortDirection;
  key: string;
};

export type AdminSortAccessor<T> = (row: T) => number | string | null | undefined;

const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function AdminListHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-24 items-center justify-between gap-5 max-md:flex-col max-md:items-start">
      <div>
        <h1 className="text-[2rem] font-bold leading-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1.5 text-base text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminListTabs<T extends string>({
  items,
  onChange,
  value,
}: {
  items: Array<AdminListTab<T>>;
  onChange: (value: T) => void;
  value: T;
}) {
  return (
    <div className="flex h-10 flex-wrap items-center gap-7 border-b border-slate-200">
      {items.map((item) => (
        <button
          className={`inline-flex h-10 items-center gap-2 border-b-2 px-1 text-sm font-medium transition ${
            value === item.id
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.label}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              value === item.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {item.count}
          </span>
        </button>
      ))}
    </div>
  );
}

export function AdminListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export function AdminBulkActionBar({
  actions,
  onClear,
  selectedCount,
}: {
  actions: AdminBulkAction[];
  onClear: () => void;
  selectedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
      <strong className="text-sm font-semibold text-blue-800">
        {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
      </strong>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            className={`inline-flex h-9 items-center justify-center rounded-lg border bg-white px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              action.tone === 'red'
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
            disabled={action.disabled}
            key={action.label}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        ))}
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          onClick={onClear}
          type="button"
        >
          Annuler la sélection
        </button>
      </div>
    </div>
  );
}

export function AdminSearchInput({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="min-w-[260px] flex-[1.4]">
      <span className="sr-only">Recherche</span>
      <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-slate-500">
        <SearchIcon />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </div>
    </label>
  );
}

export function AdminSelect({
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
    <label className="min-w-40 flex-1">
      <span className="sr-only">{label}</span>
      <select
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

export function AdminResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
      onClick={onClick}
      type="button"
    >
      <span className="text-base leading-none">↻</span>
      Réinitialiser
    </button>
  );
}

export function AdminListTable<T>({
  bulkActions = [],
  columns,
  emptyDescription,
  emptyMessage,
  getRowKey,
  minWidth = '100%',
  onClearSelection,
  onRowClick,
  onPageChange,
  onPageSizeChange,
  onSelectedRowKeysChange,
  onSortChange,
  page,
  pageSize,
  rows,
  selectedRowKeys = [],
  sort,
  summaryLabel,
  tableLabel = 'Tous',
  total,
}: {
  bulkActions?: AdminBulkAction[];
  columns: Array<AdminListColumn<T>>;
  emptyDescription?: string;
  emptyMessage: string;
  getRowKey: (row: T, index: number) => string;
  minWidth?: string;
  onClearSelection?: () => void;
  onRowClick?: (row: T) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSelectedRowKeysChange?: (keys: string[]) => void;
  onSortChange?: (sort: AdminSortState) => void;
  page: number;
  pageSize: number;
  rows: T[];
  selectedRowKeys?: string[];
  sort?: AdminSortState | null;
  summaryLabel: string;
  tableLabel?: string;
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rowKeys = rows.map((row, index) => getRowKey(row, index));
  const selectedRowKeySet = new Set(selectedRowKeys);
  const selectedCount = selectedRowKeys.length;
  const isCurrentPageSelected =
    rowKeys.length > 0 && rowKeys.every((rowKey) => selectedRowKeySet.has(rowKey));

  useEffect(() => {
    if (page > pageCount) {
      onPageChange(pageCount);
    }
  }, [onPageChange, page, pageCount]);

  function changePage(nextPage: number) {
    if (nextPage !== page) {
      onSelectedRowKeysChange?.([]);
    }

    onPageChange(nextPage);
  }

  function changePageSize(nextPageSize: number) {
    onSelectedRowKeysChange?.([]);
    onPageSizeChange?.(nextPageSize);
    onPageChange(1);
  }

  function changeSort(nextSort: AdminSortState) {
    onSelectedRowKeysChange?.([]);
    onSortChange?.(nextSort);
    onPageChange(1);
  }

  function toggleCurrentPageSelection() {
    if (!onSelectedRowKeysChange) {
      return;
    }

    if (isCurrentPageSelected) {
      onSelectedRowKeysChange(selectedRowKeys.filter((rowKey) => !rowKeys.includes(rowKey)));
      return;
    }

    onSelectedRowKeysChange(Array.from(new Set([...selectedRowKeys, ...rowKeys])));
  }

  function toggleRowSelection(rowKey: string) {
    if (!onSelectedRowKeysChange) {
      return;
    }

    if (selectedRowKeySet.has(rowKey)) {
      onSelectedRowKeysChange(selectedRowKeys.filter((selectedRowKey) => selectedRowKey !== rowKey));
      return;
    }

    onSelectedRowKeysChange([...selectedRowKeys, rowKey]);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
        {selectedCount > 0 ? (
          <>
            <strong className="text-sm font-semibold text-slate-950">
              {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </strong>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {bulkActions.map((action) => (
                <button
                  className={`inline-flex h-8 items-center justify-center rounded-lg border bg-white px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    action.tone === 'red'
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  disabled={action.disabled}
                  key={action.label}
                  onClick={action.onClick}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
              <button
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                onClick={() => {
                  onSelectedRowKeysChange?.([]);
                  onClearSelection?.();
                }}
                type="button"
              >
                Annuler la sélection
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <strong className="text-sm font-semibold text-slate-950">{tableLabel}</strong>
              <span className="text-slate-300">•</span>
              <span className="text-sm font-medium text-slate-500">{summaryLabel}</span>
            </div>
            <button
              aria-label="Menu table"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
              type="button"
            >
              ⋮
            </button>
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full table-fixed border-collapse text-sm"
          style={{ minWidth }}
        >
          <colgroup>
            <col className="w-10" />
            {columns.map((column) => (
              <col key={column.header} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="h-10 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">
                <Checkbox
                  checked={isCurrentPageSelected}
                  label="Sélectionner la page"
                  onChange={toggleCurrentPageSelection}
                />
              </th>
              {columns.map((column) => (
                <SortableHeader
                  key={column.header}
                  label={column.header}
                  onSortChange={changeSort}
                  sort={sort}
                  sortKey={column.sortKey}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row, index) => {
                const rowKey = getRowKey(row, index);
                const isSelected = selectedRowKeySet.has(rowKey);

                return (
                <tr
                  className={`h-[52px] text-slate-700 hover:bg-slate-50/80 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${isSelected ? 'bg-blue-50/50' : ''}`}
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                >
                  <td className="px-4 py-2">
                    <Checkbox
                      checked={isSelected}
                      label="Sélectionner la ligne"
                      onChange={() => toggleRowSelection(rowKey)}
                    />
                  </td>
                  {columns.map((column) => (
                    <td
                      className={`px-4 py-2 align-middle ${column.className ?? ''}`}
                      key={column.header}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-4 py-10 text-center"
                  colSpan={columns.length + 1}
                >
                  <div className="mx-auto grid max-w-md justify-items-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      ∅
                    </span>
                    <strong className="text-sm font-semibold text-slate-950">
                      {emptyMessage}
                    </strong>
                    {emptyDescription ? (
                      <p className="text-sm text-slate-500">{emptyDescription}</p>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <span>Afficher</span>
          <select
            aria-label="Nombre d'éléments par page"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => changePageSize(Number(event.target.value))}
            value={pageSize}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>
            {total === 0
              ? '0'
              : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)}`}{' '}
            sur {total} éléments
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PaginationButton
            disabled={page <= 1}
            onClick={() => changePage(Math.max(1, page - 1))}
          >
            ‹
          </PaginationButton>
          {getPaginationItems(page, pageCount).map((item) =>
            typeof item === 'number' ? (
              <PaginationButton
                active={page === item}
                disabled={total === 0}
                key={item}
                onClick={() => changePage(item)}
              >
                {item}
              </PaginationButton>
            ) : (
              <span
                className="inline-flex h-10 min-w-10 items-center justify-center px-2 font-bold text-slate-400"
                key={item}
              >
                …
              </span>
            ),
          )}
          <PaginationButton
            disabled={page >= pageCount}
            onClick={() => changePage(Math.min(pageCount, page + 1))}
          >
            ›
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}

export function CompactActionButton({
  children,
  disabled = false,
  onClick,
  tone = 'neutral',
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: 'blue' | 'neutral' | 'red';
}) {
  const className =
    tone === 'blue'
      ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
      : tone === 'red'
        ? 'border-red-200 text-red-600 hover:bg-red-50'
        : 'border-slate-200 text-slate-600 hover:bg-slate-50';

  return (
    <button
      className={`inline-flex h-7 items-center whitespace-nowrap rounded-md border bg-white px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

export function AdminActionMenu({
  items,
}: {
  items: Array<{
    disabled?: boolean;
    label: string;
    onClick?: () => void;
    tone?: 'neutral' | 'red';
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        aria-label="Actions secondaires"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        ⋯
      </button>
      {isOpen ? (
        <span className="absolute right-0 top-8 z-30 grid min-w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left text-sm shadow-lg">
          {items.map((item) => (
            <button
              className={`px-3 py-2 text-left text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${
                item.tone === 'red'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              disabled={item.disabled}
              key={item.label}
              onClick={() => {
                setIsOpen(false);
                item.onClick?.();
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

export function AdminBadge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'purple';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-100 text-blue-700'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : tone === 'amber'
          ? 'bg-amber-100 text-amber-700'
          : tone === 'red'
            ? 'bg-red-100 text-red-700'
            : tone === 'purple'
              ? 'bg-violet-100 text-violet-700'
              : 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

export function IdText({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="text-slate-500">—</span>;
  }

  return (
    <span className="font-mono text-xs text-slate-600" title={value}>
      {formatShortId(value)}
    </span>
  );
}

export function ValueText({ value }: { value?: number | string | null }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-500">—</span>;
  }

  return <>{String(value)}</>;
}

export function matchesSearch(query: string, ...values: Array<number | string | null | undefined>) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return values
    .filter((value) => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return dateFormatter.format(date);
}

export function formatShortId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function getInitials(value?: string | null) {
  if (!value) {
    return 'U';
  }

  const parts = value
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

export function getDateThreshold(filter: 'all' | '7d' | '30d') {
  if (filter === 'all') {
    return null;
  }

  const days = filter === '7d' ? 7 : 30;

  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;

  return rows.slice(start, start + pageSize);
}

export function sortAdminRows<T>(
  rows: T[],
  sort: AdminSortState | null | undefined,
  accessors: Record<string, AdminSortAccessor<T>>,
) {
  if (!sort) {
    return rows;
  }

  const accessor = accessors[sort.key];

  if (!accessor) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const result = compareAdminValues(accessor(left), accessor(right));

    return sort.direction === 'asc' ? result : -result;
  });
}

export function getPaginationItems(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) {
    items.push('start-ellipsis');
  }

  for (let currentPage = start; currentPage <= end; currentPage += 1) {
    items.push(currentPage);
  }

  if (end < pageCount - 1) {
    items.push('end-ellipsis');
  }

  items.push(pageCount);

  return items;
}

function compareAdminValues(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
) {
  const leftEmpty = left === undefined || left === null || left === '';
  const rightEmpty = right === undefined || right === null || right === '';

  if (leftEmpty && rightEmpty) {
    return 0;
  }

  if (leftEmpty) {
    return 1;
  }

  if (rightEmpty) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), 'fr', {
    numeric: true,
    sensitivity: 'base',
  });
}

function SortableHeader({
  label,
  onSortChange,
  sort,
  sortKey,
}: {
  label: string;
  onSortChange?: (sort: AdminSortState) => void;
  sort?: AdminSortState | null;
  sortKey?: string;
}) {
  const isActive = Boolean(sortKey && sort?.key === sortKey);
  const direction = isActive ? sort?.direction : null;
  const ariaSort =
    direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';

  if (!sortKey) {
    return (
      <th className="px-4 py-2">
        <span className="inline-flex items-center gap-1">{label}</span>
      </th>
    );
  }

  return (
    <th aria-sort={ariaSort} className="px-4 py-2">
      <button
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          isActive ? 'text-slate-800' : ''
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onSortChange?.({
            direction: direction === 'asc' ? 'desc' : 'asc',
            key: sortKey,
          });
        }}
        type="button"
      >
        {label}
        <span className="text-slate-400">
          {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '⌄'}
        </span>
      </button>
    </th>
  );
}

function Checkbox({
  checked = false,
  label,
  onChange,
}: {
  checked?: boolean;
  label: string;
  onChange?: () => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={`flex h-4 w-4 items-center justify-center rounded border transition ${
        checked
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-300 bg-white hover:border-blue-300'
      }`}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onChange?.();
      }}
      title={label}
      type="button"
    >
      {checked ? <span className="text-[10px] leading-none">✓</span> : null}
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
  children: ReactNode;
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
