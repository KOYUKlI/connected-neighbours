import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
      className={buttonStyles(variant, size, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
