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
    blue: 'border-blue-100 bg-blue-50/55 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    red: 'border-red-100 bg-red-50/60 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={cn('rounded-lg border p-4', accents[accent], className)}>
      <p className="text-xs font-bold uppercase tracking-wide text-current/70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-sm font-medium text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}
