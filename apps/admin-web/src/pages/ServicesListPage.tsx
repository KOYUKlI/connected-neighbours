import type { ReactNode } from 'react';

export function ServicesListPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
