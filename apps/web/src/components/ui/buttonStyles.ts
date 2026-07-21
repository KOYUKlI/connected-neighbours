import { cn } from './classNames';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-emerald-700 bg-emerald-700 text-white shadow-sm hover:border-emerald-800 hover:bg-emerald-800',
  secondary: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100',
  ghost: 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 py-1.5 text-sm',
  md: 'min-h-11 px-4 py-2 text-sm',
};

export function buttonStyles(variant: ButtonVariant = 'ghost', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg border font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}
