import type { ReactNode } from 'react';

export function AppShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)] max-[980px]:grid-cols-1">
      {sidebar}
      <main className="flex min-w-0 flex-col p-7 max-[980px]:p-5">{children}</main>
    </div>
  );
}
