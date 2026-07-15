import { formatNumber } from '../utils/format';

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      <p>{detail}</p>
    </article>
  );
}
