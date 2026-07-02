import type { ReactNode } from 'react';

export type TableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function Table<T>({
  columns,
  getRowKey,
  rows,
}: {
  columns: TableColumn<T>[];
  getRowKey: (row: T, index: number) => string;
  rows: T[];
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={`border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 ${column.className ?? ''}`}
                key={column.header}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((column) => (
                <td
                  className={`border-b border-slate-100 px-4 py-3.5 align-middle text-sm text-slate-700 last:border-b-0 ${column.className ?? ''}`}
                  key={column.header}
                >
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
