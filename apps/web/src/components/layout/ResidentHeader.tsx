import { Link } from 'react-router-dom';

import type { AuthUser } from '../../api/auth';
import { Icon } from '../ui/Icon';
import { DesktopNavigation } from '../navigation/DesktopNavigation';
import { NotificationsPanel } from './NotificationsPanel';
import { UserMenu } from './UserMenu';

export function ResidentHeader({
  onLogout,
  points,
  reservedPoints,
  user,
}: {
  onLogout: () => void;
  points?: number;
  reservedPoints?: number;
  user: AuthUser;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link aria-label="Connected Neighbours - Accueil" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" to="/">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-800 text-xs font-black text-white">CN</span>
          <span className="hidden text-sm font-extrabold leading-tight text-slate-950 xl:block">Connected<br />Neighbours</span>
        </Link>
        <DesktopNavigation />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link className="hidden min-h-10 items-center gap-1.5 rounded-lg bg-amber-50 px-3 text-sm font-extrabold text-amber-800 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:inline-flex" to="/profile">
            <Icon className="size-4" name="coins" />
            {points ?? user.pointsBalance ?? 0} pts
          </Link>
          <NotificationsPanel reservedPoints={reservedPoints} />
          <UserMenu onLogout={onLogout} user={user} />
        </div>
      </div>
    </header>
  );
}
