export function ValueOrDash({ value }: { value?: string | number | null }) {
  if (value === undefined || value === null || value === '') {
    return <span className="muted">-</span>;
  }

  return <>{value}</>;
}
