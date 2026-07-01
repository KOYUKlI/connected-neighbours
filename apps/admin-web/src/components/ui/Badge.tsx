import type { ReactNode } from 'react';

import { cn } from './classNames';

type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<BadgeTone, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  neutral: 'bg-slate-200 text-slate-600',
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
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
