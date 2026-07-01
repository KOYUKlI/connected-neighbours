export type BreadcrumbItem = {
  label: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Fil d'Ariane">
      {items.map((item, index) => (
        <span className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {index > 0 ? <span className="text-slate-300">/</span> : null}
          <span className={index === items.length - 1 ? 'font-semibold text-blue-600' : 'font-medium text-slate-500'}>
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
