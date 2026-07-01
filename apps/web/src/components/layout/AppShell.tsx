import type { ReactNode } from 'react';

export function AppShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[270px_minmax(0,1fr)] bg-slate-100 text-slate-600 max-[1100px]:grid-cols-1">
      {sidebar}
      <main className="min-w-0 p-7 max-[1100px]:p-5">{children}</main>
    </div>
  );
}
