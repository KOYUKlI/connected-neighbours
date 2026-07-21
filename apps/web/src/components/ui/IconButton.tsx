import type { ButtonHTMLAttributes } from 'react';

import { cn } from './classNames';
import { Icon, type IconName } from './Icon';

export function IconButton({
  className,
  icon,
  label,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-50',
        className,
      )}
      title={label}
      type={type}
      {...props}
    >
      <Icon className="size-5" name={icon} />
    </button>
  );
}
