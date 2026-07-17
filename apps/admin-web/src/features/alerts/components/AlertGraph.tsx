import type { SeverityDistributionEntry } from '../hooks/useIncidentAlerts';

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

export function AlertGraph({ distribution }: AlertGraphProps) {
  if (distribution.length === 0) {
    return <div className="empty-state">Aucune alerte a repartir.</div>;
  }

  return (
    <div className="alert-graph">
      {distribution.map((entry) => (
        <div className="alert-graph-row" key={entry.severity}>
          <span className="alert-graph-label">
            {severityLabels[entry.severity] ?? entry.severity}
          </span>
          <div className="alert-graph-track">
            <div
              className={`alert-graph-bar severity-${entry.severity}`}
              style={{ width: `${entry.percentage}%` }}
            />
          </div>
          <span className="alert-graph-value">
            {entry.count} ({entry.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}
