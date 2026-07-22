import { EmptyState } from '../../../components/ui/EmptyState';

export type SeverityDistributionEntry = {
  severity: string;
  count: number;
  percentage: number;
};

type AlertGraphProps = {
  distribution: SeverityDistributionEntry[];
};

const severityLabels: Record<string, string> = {
  low: 'Mineure',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
  unknown: 'Inconnue',
};

const severityBarClass: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
  unknown: 'bg-slate-400',
};

export function AlertGraph({ distribution }: AlertGraphProps) {
  if (distribution.length === 0) {
    return <EmptyState message="Aucune alerte à répartir." />;
  }

  return (
    <div className="grid gap-2.5">
      {distribution.map((entry) => (
        <div className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3" key={entry.severity}>
          <span className="text-sm font-semibold text-slate-600">
            {severityLabels[entry.severity] ?? entry.severity}
          </span>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${severityBarClass[entry.severity] ?? severityBarClass.unknown}`}
              style={{ width: `${entry.percentage}%` }}
            />
          </div>
          <span className="text-right text-sm text-slate-500">
            {entry.count} ({entry.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}
