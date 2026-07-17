export function SeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? 'unknown';

  return <span className={`badge severity-${severity}`}>{severity}</span>;
}
