export class GraphUnavailableError extends Error {
  constructor(public readonly code: string) {
    super('La projection graphe est temporairement indisponible.');
    this.name = 'GraphUnavailableError';
  }
}

export function normalizeGraphError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
  const message = error instanceof Error ? error.message : '';
  const diagnostic = `${code} ${message}`;
  if (
    diagnostic.includes('Security') ||
    diagnostic.includes('Authorization') ||
    diagnostic.includes('Unauthorized')
  ) {
    return 'authentication_failed';
  }
  if (
    diagnostic.includes('TransientError') ||
    diagnostic.includes('SessionExpired')
  ) {
    return 'transient_error';
  }
  if (diagnostic.includes('ServiceUnavailable')) return 'service_unavailable';
  if (/timeout|timed out|deadline/i.test(diagnostic)) {
    return 'timeout';
  }
  return 'graph_error';
}
