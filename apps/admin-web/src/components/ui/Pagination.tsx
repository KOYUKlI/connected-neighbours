export function Pagination({
  onPageChange,
  page,
  pageSize,
  total,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
      <span>
        {firstItem}-{lastItem} sur {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Précédent
        </button>
        <span className="font-bold text-slate-700">
          Page {page} / {pageCount}
        </span>
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
