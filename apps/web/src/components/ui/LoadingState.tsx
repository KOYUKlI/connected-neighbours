export function LoadingState({ message = 'Chargement en cours...' }: { message?: string }) {
  return (
    <div aria-live="polite" className="flex min-h-32 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-8 text-sm text-slate-600">
      <span className="size-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
      {message}
    </div>
  );
}
