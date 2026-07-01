import type { ReactNode } from 'react';

import { cn } from './classNames';

export function Toolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
