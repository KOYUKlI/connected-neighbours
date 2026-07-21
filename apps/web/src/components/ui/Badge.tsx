import type { ReactNode } from 'react';

import { cn } from './classNames';

type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const tones: Record<BadgeTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
