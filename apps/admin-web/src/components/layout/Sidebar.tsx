import type { ReactNode } from 'react';

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-7 border-r border-slate-200 bg-white p-6 max-[980px]:border-b max-[980px]:border-r-0">
      {children}
    </aside>
  );
}
