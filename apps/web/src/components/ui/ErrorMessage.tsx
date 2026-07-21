import { cn } from './classNames';

export function ErrorMessage({
  className,
  message,
}: {
  className?: string;
  message: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700',
        className,
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
