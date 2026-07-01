import type { ReactNode } from 'react';

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="flex items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-[760px]:flex-col">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="m-0 text-[2rem] font-extrabold leading-tight tracking-tight text-slate-950 max-sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
