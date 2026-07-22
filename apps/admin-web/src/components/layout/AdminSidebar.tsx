import { cn } from '../ui/classNames';

export type AdminNavigationItem<T extends string> = {
  id: T;
  label: string;
  description?: string;
  icon?: string;
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
  return (
    <aside className="sticky top-0 h-screen border-r border-slate-200 bg-white px-4 py-6 max-[1100px]:static max-[1100px]:h-auto max-[1100px]:border-b max-[1100px]:border-r-0">
      <div className="grid h-full content-between gap-5">
        <div className="grid gap-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600 text-2xl font-semibold text-white shadow-sm">
              CN
            </span>
            <div>
              <strong className="block text-[17px] font-bold leading-[1.15] text-slate-950">
                Connected<br />Neighbours
              </strong>
            </div>
          </div>

          <nav className="grid gap-2 max-[1100px]:grid-cols-4 max-[760px]:grid-cols-2" aria-label="Navigation admin">
            {items.map((item) => {
              const isActive = item.id === activeItem;

              return (
                <button
                  className={cn(
                    'relative flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-100',
                    isActive
                      ? 'bg-blue-50 text-blue-700 before:absolute before:left-0 before:top-2 before:h-7 before:w-1 before:rounded-full before:bg-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                  )}
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                >
                  <NavigationIcon id={item.icon ?? String(item.id)} />
                  <span className="text-[15px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button className="flex items-center gap-3 border-t border-slate-200 pt-4 text-sm font-medium text-slate-500 max-[1100px]:hidden" type="button">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200">
            ‹
          </span>
          Réduire le menu
        </button>
      </div>
    </aside>
  );
}

function NavigationIcon({ id }: { id: string }) {
  const icon = getNavigationIcon(id);

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {icon}
    </svg>
  );
}

function getNavigationIcon(id: string) {
  switch (id) {
    case 'dashboard':
      return <path d="M4 12h6V4H4v8Zm10 8h6V4h-6v16ZM4 20h6v-4H4v4Z" />;
    case 'neighborhoods':
      return <path d="M4 20V8l5-3 6 3 5-3v12l-5 3-6-3-5 3Zm5-15v12m6-9v12" />;
    case 'services':
      return <path d="M8 7V6a4 4 0 0 1 8 0v1m-11 3h14l-1 10H6L5 10Zm4 0v2m6-2v2" />;
    case 'contracts':
      return <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M9.5 12h5m-5 4h7" />;
    case 'documents':
      return <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M9.5 12h5m-5 4h7M4 7h3m-3 4h3m-3 4h3" />;
    case 'disputes':
      return <><path d="M7 3h10v4l3 3-3 3v8H7v-8l-3-3 3-3V3Z" /><path d="M9 9h6M9 13h6M9 17h4" /></>;
    case 'events':
      return <><path d="M5 5h14v15H5V5Zm3-2v4m8-4v4M5 9h14" /><path d="m9 14 2 2 4-4" /></>;
    case 'votes':
      return <><path d="M6 4h12v16H6V4Z" /><path d="m9 10 2 2 4-4M9 16h6" /></>;
    case 'incidents':
      return <path d="M12 4 3 20h18L12 4Zm0 5v5m0 3h.01" />;
    case 'sync':
      return <path d="M20 7h-6a5 5 0 0 0-4.6 3M4 17h6a5 5 0 0 0 4.6-3M17 4l3 3-3 3M7 20l-3-3 3-3" />;
    case 'users':
      return <path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m-4 9a8 8 0 0 1 16 0M18 9a3 3 0 0 1 3 3m-18 0a3 3 0 0 1 3-3" />;
    default:
      return <path d="M5 5h14v14H5z" />;
  }
}
