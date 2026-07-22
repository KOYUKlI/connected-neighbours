import type { ReputationSummary as Reputation } from '../../api/reviews';

export function ReputationSummary({ reputation }: { reputation: Reputation }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <strong className="block text-3xl font-black text-emerald-900">
          {reputation.averageRating ?? '—'}
        </strong>
        <span className="mt-1 block text-sm font-semibold text-emerald-800">
          {reputation.reviewCount} avis publié{reputation.reviewCount > 1 ? 's' : ''}
        </span>
        <span className="mt-2 block text-xs text-emerald-700">
          Score {reputation.reputationScore ?? '—'}/100
        </span>
      </div>
      <div className="grid content-center gap-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const key = String(rating) as keyof typeof reputation.ratingDistribution;
          const count = reputation.ratingDistribution[key];
          const width = reputation.reviewCount
            ? Math.round((count / reputation.reviewCount) * 100)
            : 0;
          return (
            <div className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-xs" key={rating}>
              <span className="font-bold text-slate-700">{rating}/5</span>
              <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-amber-400" style={{ width: `${width}%` }} />
              </span>
              <span className="text-right text-slate-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
