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
      className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
