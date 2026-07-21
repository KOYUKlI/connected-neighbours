import { NavLink } from 'react-router-dom';

import { cn } from '../ui/classNames';
import { Icon, type IconName } from '../ui/Icon';

const links: Array<{ icon: IconName; label: string; to: string }> = [
  { icon: 'home', label: 'Accueil', to: '/' },
  { icon: 'services', label: 'Services', to: '/services' },
  { icon: 'users', label: 'Voisins', to: '/neighbors' },
  { icon: 'message', label: 'Messages', to: '/messages' },
  { icon: 'menu', label: 'Menu', to: '/activities' },
];

export function MobileBottomNavigation() {
  return (
    <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      {links.map((link) => (
        <NavLink
          aria-label={link.label}
          className={({ isActive }) => cn(
            'flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-slate-500 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-200',
            isActive && 'text-emerald-800',
          )}
          end={link.to === '/'}
          key={link.to}
          to={link.to}
        >
          <Icon className="size-5" name={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
