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
        'flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            className={cn(
              'inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition',
              isActive
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-950',
            )}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
