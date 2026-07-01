import type { SelectHTMLAttributes } from 'react';

import { cn } from './classNames';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline focus:outline-4 focus:outline-blue-200',
        className,
      )}
      {...props}
    />
  );
}
