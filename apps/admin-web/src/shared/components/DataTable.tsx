import type { ReactNode } from 'react';

import { EmptyState } from './EmptyState';

export type TableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T extends { id: string | null }> = {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage: string;
};

export function DataTable<T extends { id: string | null }>({
  columns,
  rows,
  emptyMessage,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.header}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? `row-${index}`}>
              {columns.map((column) => (
                <td className={column.className} key={column.header}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
