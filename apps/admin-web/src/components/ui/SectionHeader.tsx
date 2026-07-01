import type { ReactNode } from 'react';

import { cn } from './classNames';

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 max-sm:flex-col',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="m-0 text-xl font-extrabold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
