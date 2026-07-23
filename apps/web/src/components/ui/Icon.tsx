import type { SVGProps } from 'react';

export type IconName =
  | 'activity'
  | 'arrow-left'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'clock'
  | 'close'
  | 'coins'
  | 'contract'
  | 'filter'
  | 'home'
  | 'leaf'
  | 'map-pin'
  | 'menu'
  | 'message'
  | 'mic'
  | 'monitor'
  | 'paw'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'services'
  | 'settings'
  | 'user'
  | 'users'
  | 'wrench';

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...common} {...props}>
      {name === 'home' ? <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></> : null}
      {name === 'services' ? <><path d="M4 7h16M4 12h16M4 17h10" /><circle cx="18" cy="17" r="2" /></> : null}
      {name === 'users' ? <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6" /><path d="M16 4a3 3 0 0 1 0 6M17 14c2.5.5 4 2.4 4 5" /></> : null}
      {name === 'activity' ? <><path d="M4 6h16M4 12h16M4 18h10" /><path d="m17 16 2 2 3-4" /></> : null}
      {name === 'message' ? <path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1-5a9 9 0 1 1 18-5Z" /> : null}
      {name === 'menu' ? <><path d="M4 6h16M4 12h16M4 18h16" /></> : null}
      {name === 'bell' ? <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></> : null}
      {name === 'settings' ? <><circle cx="12" cy="12" r="3" /><path d="M19 13.5v-3l2-1-2-3-2 1a8 8 0 0 0-2.5-1.5L14 3h-4l-.5 3A8 8 0 0 0 7 7.5l-2-1-2 3 2 1v3l-2 1 2 3 2-1A8 8 0 0 0 9.5 18l.5 3h4l.5-3a8 8 0 0 0 2.5-1.5l2 1 2-3-2-1Z" /></> : null}
      {name === 'user' ? <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-5 3-8 8-8s8 3 8 8" /></> : null}
      {name === 'chevron-down' ? <path d="m7 10 5 5 5-5" /> : null}
      {name === 'plus' ? <path d="M12 5v14M5 12h14" /> : null}
      {name === 'search' ? <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></> : null}
      {name === 'filter' ? <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" /> : null}
      {name === 'close' ? <path d="m6 6 12 12M18 6 6 18" /> : null}
      {name === 'arrow-left' ? <path d="m15 18-6-6 6-6M9 12h11" /> : null}
      {name === 'refresh' ? <><path d="M20 7v5h-5" /><path d="M18 16a8 8 0 1 1 1-8l1 4" /></> : null}
      {name === 'map-pin' ? <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></> : null}
      {name === 'coins' ? <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v5c0 2 3 3 7 3s7-1 7-3V6M5 11v5c0 2 3 3 7 3s7-1 7-3v-5" /></> : null}
      {name === 'clock' ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> : null}
      {name === 'calendar' ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></> : null}
      {name === 'contract' ? <><path d="M6 3h9l3 3v15H6V3Z" /><path d="M15 3v4h4M9 12h6M9 16h6" /></> : null}
      {name === 'check' ? <path d="m5 12 4 4L19 6" /> : null}
      {name === 'wrench' ? <><path d="M14 7a5 5 0 0 0-6 6L3 18l3 3 5-5a5 5 0 0 0 6-6l-3 3-3-3 3-3Z" /></> : null}
      {name === 'book' ? <><path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2V5Z" /><path d="M20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2V5Z" /></> : null}
      {name === 'paw' ? <><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="5" cy="13" r="2" /><circle cx="19" cy="13" r="2" /><path d="M8 18c0-3 2-5 4-5s4 2 4 5c0 2-2 3-4 3s-4-1-4-3Z" /></> : null}
      {name === 'leaf' ? <><path d="M20 4C10 4 5 9 5 15c0 3 2 5 5 5 6 0 10-6 10-16Z" /><path d="M4 21c3-6 7-9 13-12" /></> : null}
      {name === 'monitor' ? <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></> : null}
      {name === 'mic' ? <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 19v3" /></> : null}
    </svg>
  );
}
