import type { ReactNode } from 'react';

export function Topbar({ actions, children }: { actions: ReactNode; children: ReactNode }) {
  return (
    <header className="mb-5 flex items-center justify-between gap-5 max-[760px]:items-start max-[760px]:flex-col">
      {children}
      <div className="flex items-center gap-2.5 max-[760px]:w-full max-[760px]:flex-wrap">
        {actions}
      </div>
    </header>
  );
}
