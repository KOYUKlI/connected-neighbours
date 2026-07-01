import type { ReactNode } from 'react';

import { cn } from './classNames';

export type TabItem<T extends string> = {
  id: T;
  label: string;
  count?: ReactNode;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (nextValue: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-7 border-b border-slate-200',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            className={cn(
              'inline-flex min-h-11 items-center gap-2 border-b-2 px-1 text-sm font-semibold transition',
              isActive
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-950',
            )}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
              )}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
