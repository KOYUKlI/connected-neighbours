import type { AuthUser } from '../../../api/auth';
import type { CreateIncidentInput, IncidentSeverity, IncidentType } from '../../../api/incidents';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { useIncidentForm } from '../hooks/useIncidentForm';
import { incidentSeverityLabels, incidentTypeLabels } from '../incidentPresentation';

type IncidentFormProps = {
  currentUser: AuthUser | null;
  isPending: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<boolean>;
};

export function IncidentForm({ currentUser, isPending, onCreate }: IncidentFormProps) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    severity,
    setSeverity,
    neighborhoodId,
    setNeighborhoodId,
    handleSubmit,
  } = useIncidentForm(currentUser, onCreate);

  return (
    <Card>
      <h2 className="text-lg font-extrabold text-slate-950">Signaler un incident</h2>
      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Titre
          <Input onChange={(event) => setTitle(event.target.value)} required value={title} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Description
          <Textarea
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            value={description}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-slate-900">
            Type
            <Select
              onChange={(event) => setType(event.target.value as IncidentType)}
              value={type}
            >
              {Object.entries(incidentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-900">
            Sévérité
            <Select
              onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
              value={severity}
            >
              {Object.entries(incidentSeverityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Quartier
          <Input
            onChange={(event) => setNeighborhoodId(event.target.value)}
            required
            value={neighborhoodId}
          />
        </label>
        <Button className="w-fit" disabled={isPending} type="submit" variant="primary">
          {isPending ? 'Signalement…' : 'Signaler'}
        </Button>
      </form>
    </Card>
  );
}
