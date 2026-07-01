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
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
