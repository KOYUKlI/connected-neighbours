import type { AdminIncidentRow, AlertSeverityInput, IncidentTypeInput } from '../../api/admin';
import { AdminBadge } from '../../components/ui/AdminList';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { AlertFormModal } from '../alerts/components/AlertFormModal';
import { AlertGraph } from '../alerts/components/AlertGraph';
import { AlertWidget } from '../alerts/components/AlertWidget';
import { useIncidentDetailPanel } from './hooks/useIncidentDetailPanel';
import { useIncidentEditModal } from './hooks/useIncidentEditModal';

const typeOptions: { value: IncidentTypeInput; label: string }[] = [
  { value: 'security', label: 'Sécurité' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'nuisance', label: 'Nuisance' },
  { value: 'cleanliness', label: 'Propreté' },
  { value: 'traffic', label: 'Circulation' },
  { value: 'other', label: 'Autre' },
];

const severityOptions: { value: AlertSeverityInput; label: string }[] = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
];

export function IncidentDetailPanel({
  incidentId,
  onBack,
  onChanged,
}: {
  incidentId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const {
    incident,
    alerts,
    loading,
    pending,
    error,
    severityDistribution,
    editOpen,
    openEdit,
    closeEdit,
    handleIncidentSaved,
    alertModal,
    openCreateAlert,
    openEditAlert,
    closeAlertModal,
    submitAlertModal,
    handleResolveIncident,
    handleCloseIncident,
    handleResolveAlert,
  } = useIncidentDetailPanel(incidentId, onChanged);

  if (loading) return <LoadingState message="Chargement de l'incident…" />;

  if (!incident) {
    return (
      <div className="grid gap-4">
        {error ? <ErrorMessage message={error} /> : null}
        <Button className="w-fit" onClick={onBack}>
          Retour aux incidents
        </Button>
      </div>
    );
  }

  const status = incident.status ?? '';
  const canResolve = !['resolved', 'closed', 'rejected'].includes(status);
  const canClose = !['closed', 'rejected'].includes(status);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            className="mb-3 inline-flex min-h-10 items-center text-sm font-bold text-slate-500 hover:text-blue-700"
            onClick={onBack}
            type="button"
          >
            ← Retour aux incidents
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge tone={getSeverityTone(incident.severity)}>
              {formatSeverity(incident.severity)}
            </AdminBadge>
            <AdminBadge tone={getIncidentStatusTone(incident.status)}>
              {formatIncidentStatus(incident.status)}
            </AdminBadge>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{incident.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatIncidentType(incident.type)} · signalé le {formatDate(incident.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openEdit} variant="secondary">
            Modifier
          </Button>
          {canResolve ? (
            <Button disabled={pending !== null} onClick={() => void handleResolveIncident()} variant="primary">
              Résoudre
            </Button>
          ) : null}
          {canClose ? (
            <Button disabled={pending !== null} onClick={() => void handleCloseIncident()} variant="danger">
              Fermer
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
              {incident.description || 'Aucune description renseignée.'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">Alertes</h2>
              <Button onClick={openCreateAlert} variant="secondary">
                + Nouvelle alerte
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {alerts.map((alert) => (
                <AlertWidget
                  alert={alert}
                  key={alert.id}
                  onEdit={openEditAlert}
                  onResolve={handleResolveAlert}
                />
              ))}
              {alerts.length === 0 ? (
                <EmptyState message="Aucune alerte rattachée à cet incident." />
              ) : null}
            </div>
          </Card>
        </div>

        <aside className="grid content-start gap-5">
          <Card>
            <h2 className="font-bold text-slate-950">Informations clés</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <Info label="Quartier" value={incident.neighborhoodId} />
              <Info label="Source" value={incident.source} />
              <Info label="Identifiant externe" value={incident.externalId} />
              <Info label="Dernière synchronisation" value={formatDate(incident.lastSyncedAt)} />
            </dl>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-950">Répartition des alertes</h2>
            <div className="mt-4">
              <AlertGraph distribution={severityDistribution} />
            </div>
          </Card>
        </aside>
      </div>

      <IncidentEditModal
        incident={incident}
        key={`${incident.id}-${editOpen}`}
        onClose={closeEdit}
        onSaved={handleIncidentSaved}
        open={editOpen}
      />

      <AlertFormModal
        alert={alertModal === 'create' ? null : alertModal}
        key={alertModal === 'create' ? 'create' : alertModal?.id ?? 'closed'}
        onClose={closeAlertModal}
        onSubmit={submitAlertModal}
        open={alertModal !== null}
        pending={pending === 'alert-save'}
      />
    </section>
  );
}

function IncidentEditModal({
  incident,
  onClose,
  onSaved,
  open,
}: {
  incident: AdminIncidentRow;
  onClose: () => void;
  onSaved: (incident: AdminIncidentRow) => void;
  open: boolean;
}) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    severity,
    setSeverity,
    pending,
    error,
    handleSubmit,
  } = useIncidentEditModal(incident, onSaved);

  return (
    <Modal
      description="Ces changements sont visibles immédiatement par les habitants."
      onClose={onClose}
      open={open}
      title="Modifier l'incident"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormField label="Titre">
          <Input onChange={(event) => setTitle(event.target.value)} required value={title} />
        </FormField>

        <FormField label="Description">
          <Textarea
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            value={description}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type">
            <Select onChange={(event) => setType(event.target.value as IncidentTypeInput)} value={type}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Sévérité">
            <Select
              onChange={(event) => setSeverity(event.target.value as AlertSeverityInput)}
              value={severity}
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {error ? <ErrorMessage message={error} /> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={onClose} type="button">
            Annuler
          </Button>
          <Button disabled={pending} type="submit" variant="primary">
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value ?? '—'}</dd>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatSeverity(severity?: string) {
  const labels: Record<string, string> = {
    critical: 'Critique',
    high: 'Haute',
    low: 'Basse',
    medium: 'Moyenne',
  };

  return labels[severity ?? ''] ?? severity ?? 'Inconnue';
}

function formatIncidentStatus(status?: string) {
  const labels: Record<string, string> = {
    closed: 'Fermé',
    in_progress: 'En cours',
    open: 'Ouvert',
    rejected: 'Rejeté',
    reported: 'Signalé',
    resolved: 'Résolu',
  };

  return labels[status ?? ''] ?? status ?? 'Inconnu';
}

function formatIncidentType(type?: string) {
  const labels: Record<string, string> = {
    cleanliness: 'Propreté',
    maintenance: 'Maintenance',
    nuisance: 'Nuisance',
    other: 'Autre',
    security: 'Sécurité',
    traffic: 'Circulation',
  };

  return labels[type ?? ''] ?? type ?? 'Autre';
}

function getSeverityTone(severity?: string) {
  if (severity === 'critical' || severity === 'high') return 'red' as const;
  if (severity === 'medium') return 'amber' as const;
  return 'emerald' as const;
}

function getIncidentStatusTone(status?: string) {
  if (status === 'resolved' || status === 'closed') return 'emerald' as const;
  if (status === 'rejected') return 'red' as const;
  if (status === 'in_progress') return 'blue' as const;
  return 'amber' as const;
}
