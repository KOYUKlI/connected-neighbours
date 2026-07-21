import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './classNames';

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: 'article' | 'section' | 'div';
};

export function Card({
  as: Component = 'section',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
