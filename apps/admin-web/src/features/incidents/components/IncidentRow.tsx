import type { AdminIncidentRow } from '../../../api/admin';
import { MonoValue } from '../../../shared/components/MonoValue';
import { SeverityBadge } from '../../../shared/components/SeverityBadge';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { ValueOrDash } from '../../../shared/components/ValueOrDash';
import { formatDate } from '../../../shared/utils/format';

type IncidentRowProps = {
  incident: AdminIncidentRow;
  onOpenAlerts: (incident: AdminIncidentRow) => void;
};

export function IncidentRow({ incident, onOpenAlerts }: IncidentRowProps) {
  return (
    <tr className="clickable-row" onClick={() => onOpenAlerts(incident)}>
      <td>
        <ValueOrDash value={incident.title} />
      </td>
      <td>
        <ValueOrDash value={incident.type} />
      </td>
      <td>
        <SeverityBadge value={incident.severity} />
      </td>
      <td>
        <StatusBadge value={incident.status} />
      </td>
      <td>
        <ValueOrDash value={incident.source} />
      </td>
      <td>
        <MonoValue value={incident.externalId} />
      </td>
      <td>{formatDate(incident.lastSyncedAt)}</td>
      <td>{formatDate(incident.createdAt)}</td>
    </tr>
  );
}
