export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm">
      {message}
    </div>
  );
}
