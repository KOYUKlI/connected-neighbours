import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './classNames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100',
  ghost: 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
  danger:
    'border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-sm',
  md: 'min-h-10 px-4 py-2 text-sm',
};

export function Button({
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'ghost',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-bold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-200 disabled:cursor-progress disabled:opacity-65 disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
