import type { AdminAlertRow, AlertSeverityInput } from '../../../api/admin';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/forms/FormField';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { useAlertFormModal } from '../hooks/useAlertFormModal';

const severityOptions: { value: AlertSeverityInput; label: string }[] = [
  { value: 'low', label: 'Mineure' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
];

export function AlertFormModal({
  alert,
  onClose,
  onSubmit,
  open,
  pending,
}: {
  alert: AdminAlertRow | null;
  onClose: () => void;
  onSubmit: (input: { title: string; details: string; severity: AlertSeverityInput }) => Promise<boolean>;
  open: boolean;
  pending: boolean;
}) {
  const { title, setTitle, details, setDetails, severity, setSeverity, handleSubmit } =
    useAlertFormModal(alert, onSubmit);

  return (
    <Modal
      description={alert ? "Mettez à jour les informations de l'alerte." : 'Rattachez une nouvelle alerte à cet incident.'}
      onClose={onClose}
      open={open}
      title={alert ? "Modifier l'alerte" : 'Nouvelle alerte'}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormField label="Titre">
          <Input onChange={(event) => setTitle(event.target.value)} required value={title} />
        </FormField>

        <FormField label="Détails">
          <Textarea
            onChange={(event) => setDetails(event.target.value)}
            required
            rows={4}
            value={details}
          />
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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={onClose} type="button">
            Annuler
          </Button>
          <Button disabled={pending} type="submit" variant="primary">
            {pending ? 'Enregistrement…' : alert ? 'Enregistrer' : "Créer l'alerte"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
