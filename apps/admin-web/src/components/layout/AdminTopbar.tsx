import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function AdminTopbar({
  breadcrumb,
  onLogout,
  userEmail,
  userName,
}: {
  breadcrumb?: ReactNode;
  onLogout: () => void;
  userEmail: string;
  userName: string;
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isProfileMenuOpen]);

  return (
    <header className="sticky top-0 z-20 min-h-20 border-b border-slate-200 bg-white/95 px-8 py-3 backdrop-blur max-[760px]:static max-[760px]:px-4">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center justify-between gap-4 max-[900px]:h-auto max-[900px]:items-start max-[900px]:flex-col">
        <div className="min-w-0">{breadcrumb}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-[900px]:justify-start">
          <IconButton label="Paramètres" type="settings" />
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50" type="button" aria-label="Notifications">
            <TopbarIcon type="bell" />
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 text-sm text-slate-600 transition hover:bg-slate-50"
              onClick={() => setIsProfileMenuOpen((value) => !value)}
              title={userEmail}
              type="button"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-base font-bold text-white">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <span className="grid leading-tight">
                <strong className="text-sm font-medium text-slate-950">{userName}</strong>
                <span className="text-xs text-slate-500">Admin</span>
              </span>
              <span className="text-slate-400">⌄</span>
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 top-12 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
                <button className="block w-full px-4 py-2.5 text-left text-slate-600 hover:bg-slate-50" type="button">
                  Profil
                </button>
                <button className="block w-full px-4 py-2.5 text-left text-slate-600 hover:bg-slate-50" type="button">
                  Paramètres
                </button>
                <button
                  className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  type="button"
                >
                  Déconnexion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ label, type }: { label: string; type: 'settings' | 'bell' }) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
      type="button"
    >
      <TopbarIcon type={type} />
    </button>
  );
}

function TopbarIcon({ type }: { type: 'settings' | 'bell' }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {type === 'settings' ? (
        <>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 0 1-2.97 2.97l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21a2.1 2.1 0 0 1-4.2 0v-.08a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.05.05a2.1 2.1 0 1 1-2.97-2.97l.05-.05A1.8 1.8 0 0 0 3.8 15a1.8 1.8 0 0 0-1.66-1.1H2a2.1 2.1 0 0 1 0-4.2h.08a1.8 1.8 0 0 0 1.66-1.1 1.8 1.8 0 0 0-.36-1.98l-.05-.05A2.1 2.1 0 1 1 6.3 3.6l.05.05a1.8 1.8 0 0 0 1.98.36 1.8 1.8 0 0 0 1.1-1.66V2a2.1 2.1 0 0 1 4.2 0v.08a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.05-.05a2.1 2.1 0 1 1 2.97 2.97l-.05.05a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.66 1.1H22a2.1 2.1 0 0 1 0 4.2h-.08A1.8 1.8 0 0 0 19.4 15Z" />
        </>
      ) : (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </>
      )}
    </svg>
  );
}
