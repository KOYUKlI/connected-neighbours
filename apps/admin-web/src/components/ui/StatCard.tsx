import type { ReactNode } from 'react';

import { cn } from './classNames';

export function StatCard({
  label,
  value,
  helper,
  accent = 'blue',
  className,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  className?: string;
}) {
  const accents = {
    blue: 'border-blue-100 bg-white text-blue-700 before:bg-blue-50',
    emerald: 'border-emerald-100 bg-white text-emerald-700 before:bg-emerald-50',
    amber: 'border-amber-100 bg-white text-amber-700 before:bg-amber-50',
    red: 'border-red-100 bg-white text-red-700 before:bg-red-50',
    slate: 'border-slate-200 bg-white text-slate-700 before:bg-slate-50',
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border p-5 shadow-sm before:absolute before:left-4 before:top-4 before:h-12 before:w-12 before:rounded-full', accents[accent], className)}>
      <div className="relative pl-16">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
        {helper ? (
          <p className="mt-2 text-xs font-medium text-slate-500">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}
