import type { ReactNode } from 'react';

import { formatInitials } from '../../utils/format';

export function UserSummary({ action, name, subtitle }: { action?: ReactNode; name: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-700">{formatInitials(name)}</span>
      <div className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{name}</strong>{subtitle ? <span className="block truncate text-xs text-slate-500">{subtitle}</span> : null}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
