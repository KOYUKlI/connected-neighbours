import type { TextareaHTMLAttributes } from 'react';

import { cn } from './classNames';

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline focus:outline-4 focus:outline-blue-200',
        className,
      )}
      {...props}
    />
  );
}
