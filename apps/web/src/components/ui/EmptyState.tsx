import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export function EmptyState({
  action,
  icon = 'services',
  message,
  title = 'Rien à afficher pour le moment',
}: {
  action?: ReactNode;
  icon?: IconName;
  message?: string;
  title?: string;
}) {
  return (
    <div className="grid justify-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <span className="mb-3 inline-flex size-11 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
        <Icon className="size-5" name={icon} />
      </span>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
