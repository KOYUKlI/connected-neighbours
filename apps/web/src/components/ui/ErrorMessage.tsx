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
        'rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-bold text-red-700',
        className,
      )}
    >
      {message}
    </div>
  );
}
