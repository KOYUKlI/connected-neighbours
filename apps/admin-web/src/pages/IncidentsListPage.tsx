import type { ReactNode } from 'react';

export function IncidentsListPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
