import { getStatusTone } from '../utils/format';

export function StatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'unknown';

  return <span className={`badge ${getStatusTone(status)}`}>{status}</span>;
}
