import { Link } from 'react-router-dom';

import type { AlertSeverity } from '../../api/alerts';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { buttonStyles } from '../../components/ui/buttonStyles';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { alertSeverityLabels } from './alertPresentation';
import { useCreateAlert } from './hooks/useCreateAlert';

export function CreateAlertPage() {
  const {
    incidentId,
    title,
    setTitle,
    details,
    setDetails,
    severity,
    setSeverity,
    isSubmitting,
    error,
    handleSubmit,
    cancel,
  } = useCreateAlert();

  return (
    <PageContainer className="grid gap-6">
      <header>
        <Link
          className={buttonStyles('ghost', 'sm', 'w-fit')}
          to={`/app/incidents/${incidentId ?? ''}/alerts`}
        >
          Retour aux alertes
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-950 sm:text-3xl">Nouvelle alerte</h1>
      </header>

      <Card as="div" className="max-w-xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-900">
            Titre
            <Input
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-900">
            Détails
            <Textarea
              onChange={(event) => setDetails(event.target.value)}
              required
              rows={4}
              value={details}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-900">
            Sévérité
            <Select
              onChange={(event) => setSeverity(event.target.value as AlertSeverity)}
              value={severity}
            >
              {Object.entries(alertSeverityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>

          {error ? <ErrorMessage message={error} /> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={cancel} type="button" variant="ghost">
              Annuler
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? 'Signalement…' : "Signaler l'alerte"}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
