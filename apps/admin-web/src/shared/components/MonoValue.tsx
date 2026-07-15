export function MonoValue({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="muted">-</span>;
  }

  return <span className="mono-value">{value}</span>;
}
