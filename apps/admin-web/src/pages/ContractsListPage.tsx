import type { ReactNode } from 'react';

export function ContractsListPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
