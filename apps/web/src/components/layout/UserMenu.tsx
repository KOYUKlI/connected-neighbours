import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AuthUser } from '../../api/auth';
import { formatInitials } from '../../utils/format';
import { Icon } from '../ui/Icon';

export function UserMenu({ onLogout, user }: { onLogout: () => void; user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:px-2"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800">{formatInitials(user.displayName ?? user.email)}</span>
        <span className="hidden max-w-32 truncate text-sm font-bold text-slate-800 md:block">{user.displayName ?? user.email}</span>
        <Icon className="hidden size-4 text-slate-500 sm:block" name="chevron-down" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl" role="menu">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-bold text-slate-900">{user.displayName ?? 'Mon compte'}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Link className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" onClick={() => setOpen(false)} role="menuitem" to="/profile"><Icon className="size-4" name="user" /> Mon profil</Link>
          <Link className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" onClick={() => setOpen(false)} role="menuitem" to="/disputes"><Icon className="size-4" name="contract" /> Mes litiges</Link>
          <Link className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" onClick={() => setOpen(false)} role="menuitem" to="/profile"><Icon className="size-4" name="settings" /> Paramètres</Link>
          <button className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100" onClick={onLogout} role="menuitem" type="button"><Icon className="size-4" name="arrow-left" /> Déconnexion</button>
        </div>
      ) : null}
    </div>
  );
}
