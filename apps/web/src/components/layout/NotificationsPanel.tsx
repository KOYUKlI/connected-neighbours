import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { IconButton } from '../ui/IconButton';

export function NotificationsPanel({ reservedPoints = 0 }: { reservedPoints?: number }) {
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
      <IconButton aria-expanded={open} aria-haspopup="dialog" icon="bell" label="Notifications" onClick={() => setOpen((value) => !value)} />
      <span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
      {open ? (
        <section aria-label="Notifications" className="fixed inset-x-3 top-16 z-50 rounded-lg border border-slate-200 bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">Notifications</h2>
            <button className="text-xs font-bold text-emerald-700 hover:text-emerald-900" onClick={() => setOpen(false)} type="button">Fermer</button>
          </div>
          {reservedPoints > 0 ? (
            <Link className="block rounded-lg bg-amber-50 p-3 text-sm text-amber-950 hover:bg-amber-100" onClick={() => setOpen(false)} to="/activities">
              <strong>{reservedPoints} points sont réservés.</strong>
              <span className="mt-1 block text-amber-800">Consultez vos contrats en cours.</span>
            </Link>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Aucune nouvelle action ne vous attend.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
