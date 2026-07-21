import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

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
  label = 'Sections',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (nextValue: T) => void;
  className?: string;
  label?: string;
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  useEffect(() => {
    refs.current.get(value)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
    const next = items[nextIndex];
    if (next) {
      onChange(next.id);
      refs.current.get(next.id)?.focus();
    }
  }

  return (
    <div
      aria-label={label}
      className={cn(
        'flex w-full snap-x gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="tablist"
    >
      {items.map((item, index) => {
        const isActive = item.id === value;
        return (
          <button
            aria-selected={isActive}
            className={cn(
              'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-200',
              isActive
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900',
            )}
            key={item.id}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(node) => {
              if (node) refs.current.set(item.id, node);
              else refs.current.delete(item.id);
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
