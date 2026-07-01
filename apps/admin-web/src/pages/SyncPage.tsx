import type { ReactNode } from 'react';

export function SyncPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
