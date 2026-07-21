import type { SelectHTMLAttributes } from 'react';

import { cn } from './classNames';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100',
        className,
      )}
      {...props}
    />
  );
}
