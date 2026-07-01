import type { ReactNode } from 'react';

export function UsersListPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
