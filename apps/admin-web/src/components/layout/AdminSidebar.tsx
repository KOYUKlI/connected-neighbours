import { useEffect, useState } from 'react';

import { cn } from '../ui/classNames';

export type AdminNavigationItem<T extends string> = {
  id: T;
  label: string;
  description?: string;
  icon?: string;
  group?: string;
};

export function AdminSidebar<T extends string>({
  activeItem,
  items,
  onNavigate,
}: {
  activeItem: T;
  items: readonly AdminNavigationItem<T>[];
  onNavigate: (item: T) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  function navigate(item: T) {
    onNavigate(item);
    setMobileOpen(false);
  }

  return (
    <>
      <button
        aria-controls="admin-mobile-navigation"
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
        className="fixed left-4 top-5 z-50 inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm min-[1101px]:hidden"
        onClick={() => setMobileOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {mobileOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 min-[1101px]:hidden">
          <button aria-label="Fermer la navigation" className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} type="button" />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,300px)] overflow-y-auto border-r border-slate-200 bg-white px-4 pb-6 pt-20 shadow-2xl" id="admin-mobile-navigation">
            <SidebarContent activeItem={activeItem} items={items} onNavigate={navigate} />
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 min-[1101px]:block">
        <SidebarContent activeItem={activeItem} items={items} onNavigate={navigate} />
      </aside>
    </>
  );
}

function SidebarContent<T extends string>({
  activeItem,
  items,
  onNavigate,
}: {
  activeItem: T;
  items: readonly AdminNavigationItem<T>[];
  onNavigate: (item: T) => void;
}) {
  const groups = items.reduce<Array<{ label: string; items: AdminNavigationItem<T>[] }>>(
    (result, item) => {
      const label = item.group ?? 'Administration';
      const group = result.find((entry) => entry.label === label);
      if (group) group.items.push(item);
      else result.push({ label, items: [item] });
      return result;
    },
    [],
  );

  return (
    <div className="grid min-h-full content-between gap-7">
      <div className="grid gap-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow-sm">CN</span>
          <div><strong className="block text-[17px] font-bold leading-tight text-slate-950">Connected<br />Neighbours</strong><span className="text-xs font-medium text-slate-400">Administration</span></div>
        </div>
        <nav aria-label="Navigation admin" className="grid gap-6">
          {groups.map((group) => (
            <div className="grid gap-1" key={group.label}>
              <p className="px-3 text-[11px] font-bold uppercase text-slate-400">{group.label}</p>
              {group.items.map((item) => {
                const isActive = item.id === activeItem;
                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-100',
                      isActive
                        ? 'bg-blue-50 text-blue-700 before:absolute before:left-0 before:top-2 before:h-7 before:w-1 before:rounded-full before:bg-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                    )}
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    type="button"
                  >
                    <NavigationIcon id={item.icon ?? String(item.id)} />
                    <span className="min-w-0"><span className="block text-sm font-semibold">{item.label}</span>{item.description ? <span className="block truncate text-[11px] font-normal text-slate-400">{item.description}</span> : null}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
      <p className="border-t border-slate-200 pt-4 text-xs text-slate-400">Connected Neighbours · Admin</p>
    </div>
  );
}

function NavigationIcon({ id }: { id: string }) {
  return <svg aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{getNavigationIcon(id)}</svg>;
}

function getNavigationIcon(id: string) {
  switch (id) {
    case 'dashboard': return <path d="M4 12h6V4H4v8Zm10 8h6V4h-6v16ZM4 20h6v-4H4v4Z" />;
    case 'neighborhoods': return <path d="M4 20V8l5-3 6 3 5-3v12l-5 3-6-3-5 3Zm5-15v12m6-9v12" />;
    case 'services': return <path d="M8 7V6a4 4 0 0 1 8 0v1m-11 3h14l-1 10H6L5 10Zm4 0v2m6-2v2" />;
    case 'contracts': return <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M9.5 12h5m-5 4h7" />;
    case 'documents': return <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M9.5 12h5m-5 4h7M4 7h3m-3 4h3m-3 4h3" />;
    case 'disputes': return <><path d="M7 3h10v4l3 3-3 3v8H7v-8l-3-3 3-3V3Z" /><path d="M9 9h6M9 13h6M9 17h4" /></>;
    case 'events': return <><path d="M5 5h14v15H5V5Zm3-2v4m8-4v4M5 9h14" /><path d="m9 14 2 2 4-4" /></>;
    case 'votes': return <><path d="M6 4h12v16H6V4Z" /><path d="m9 10 2 2 4-4M9 16h6" /></>;
    case 'reviews': return <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /><path d="M8.5 21h7" /></>;
    case 'incidents': return <path d="M12 4 3 20h18L12 4Zm0 5v5m0 3h.01" />;
    case 'alerts': return <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>;
    case 'sync': return <path d="M20 7h-6a5 5 0 0 0-4.6 3M4 17h6a5 5 0 0 0 4.6-3M17 4l3 3-3 3M7 20l-3-3 3-3" />;
    case 'graph': return <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6m-7.6 6 7.6 3.6" /></>;
    case 'users': return <path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m-4 9a8 8 0 0 1 16 0M18 9a3 3 0 0 1 3 3m-18 0a3 3 0 0 1 3-3" />;
    default: return <path d="M5 5h14v14H5z" />;
  }
}
