import { NavLink, useLocation } from 'react-router-dom';

import { cn } from '../ui/classNames';

const links = [
  { label: 'Accueil', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Voisins', to: '/neighbors' },
  { label: 'Mes activités', to: '/activities' },
  { label: 'Vie locale', to: '/local-life' },
  { label: 'Messages', to: '/messages' },
];

export function DesktopNavigation() {
  const location = useLocation();
  return (
    <nav aria-label="Navigation principale" className="hidden h-full items-stretch gap-1 lg:flex">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) => cn(
            'relative inline-flex items-center px-3 text-sm font-semibold text-slate-600 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-200',
            (isActive ||
              (link.to === '/local-life' &&
                ['/events', '/votes', '/app/local'].some((prefix) =>
                  location.pathname.startsWith(prefix),
                ))) &&
              'text-emerald-800 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-emerald-700',
          )}
          end={link.to === '/'}
          key={link.to}
          to={link.to}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
