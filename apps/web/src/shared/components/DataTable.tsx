import type { ReactNode } from 'react';

import { EmptyState } from './EmptyState';

export type TableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  getRowKey: (row: T, index: number) => string;
};

export function DataTable<T>({
  columns,
  rows,
  emptyMessage,
  getRowKey,
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
            <tr key={getRowKey(row, index)}>
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
