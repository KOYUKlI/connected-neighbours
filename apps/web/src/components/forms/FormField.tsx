import type { ReactNode } from 'react';

export function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-900">
      {label}
      {children}
    </label>
  );
}
