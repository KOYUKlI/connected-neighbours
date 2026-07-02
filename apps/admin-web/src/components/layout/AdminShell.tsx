import type { ReactNode } from 'react';

import { PageContainer } from './PageContainer';

export function AdminShell({
  children,
  sidebar,
  topbar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  topbar: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-600">
      <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-[1100px]:grid-cols-1">
        {sidebar}
        <div className="flex min-w-0 flex-col">
          {topbar}
          <PageContainer>{children}</PageContainer>
          <footer className="border-t border-slate-200 px-8 py-4 text-[11px] font-medium text-slate-300 max-[760px]:px-4">
            <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
              <span>© 2024 Connected Neighbours - Tous droits réservés.</span>
              <span>Version 1.0.0</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
