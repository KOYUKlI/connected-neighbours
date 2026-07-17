type RgpdSummaryCardProps = {
  detail: string;
  label: string;
  value: string;
};

export function RgpdSummaryCard({ detail, label, value }: RgpdSummaryCardProps) {
  return (
    <article className="metric-card rgpd-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
