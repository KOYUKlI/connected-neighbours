import { useMemo, useState, type FormEvent } from 'react';

import type { ServiceItem, ServiceProof } from '../../api/services';
import { formatDate, serviceStatusLabels } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { LoadingState } from '../ui/LoadingState';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';

type ExecutionPanelProps = {
  service: ServiceItem;
  proofs: ServiceProof[];
  proofsLoading: boolean;
  pendingAction: string | null;
  currentUserId: string;
  onStart: () => Promise<boolean>;
  onAddProof: (message: string) => Promise<boolean>;
  onMarkDone: () => Promise<boolean>;
  onValidate: () => Promise<boolean>;
  onRequestCorrection: (reason: string) => Promise<boolean>;
};

type Dialog = 'validate' | 'correction' | 'mark-done' | null;

export function ServiceExecutionPanel({
  service,
  proofs,
  proofsLoading,
  pendingAction,
  currentUserId,
  onStart,
  onAddProof,
  onMarkDone,
  onValidate,
  onRequestCorrection,
}: ExecutionPanelProps) {
  const [proofMessage, setProofMessage] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const permissions = service.permissions;
  const busy = pendingAction !== null;
  const completionProofAvailable = proofs.some((proof) => {
    if (proof.authorId !== currentUserId) return false;
    if (!service.correctionRequestedAt) return true;
    if (!proof.createdAt) return false;
    return (
      new Date(proof.createdAt).getTime() >
      new Date(service.correctionRequestedAt).getTime()
    );
  });

  const timeline = useMemo(
    () =>
      [
        service.contractSummary
          ? {
              label: 'Contrat signé',
              date: service.scheduledAt,
              done: ['active', 'completed'].includes(
                service.contractSummary.status,
              ),
            }
          : null,
        {
          label: 'Service planifié',
          date: service.scheduledAt,
          done: Boolean(service.scheduledAt),
        },
        {
          label: 'Service démarré',
          date: service.startedAt,
          done: Boolean(service.startedAt),
        },
        proofs.length > 0
          ? {
              label:
                proofs.length > 1
                  ? proofs.length + ' preuves ajoutées'
                  : 'Preuve ajoutée',
              date: proofs.at(-1)?.createdAt,
              done: true,
            }
          : null,
        {
          label: 'Réalisation déclarée',
          date: service.markedDoneAt,
          done: Boolean(service.markedDoneAt),
        },
        service.correctionRequestedAt
          ? {
              label: 'Correction demandée',
              date: service.correctionRequestedAt,
              done: true,
            }
          : null,
        {
          label: 'Réalisation validée',
          date: service.validatedAt,
          done: Boolean(service.validatedAt),
        },
        {
          label: 'Points transférés',
          date: service.completedAt,
          done:
            service.status === 'completed' &&
            service.contractSummary?.status === 'completed',
        },
      ].filter(Boolean) as Array<{
        label: string;
        date?: string | null;
        done: boolean;
      }>,
    [proofs, service],
  );

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = proofMessage.trim();
    if (!message) return;
    if (await onAddProof(message)) setProofMessage('');
  }

  async function confirmDialog() {
    const succeeded =
      dialog === 'validate'
        ? await onValidate()
        : dialog === 'mark-done'
          ? await onMarkDone()
          : false;
    if (succeeded) setDialog(null);
  }

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = correctionReason.trim();
    if (reason.length < 10) return;
    if (await onRequestCorrection(reason)) {
      setCorrectionReason('');
      setDialog(null);
    }
  }

  const mobileAction = permissions?.canStart
    ? { label: 'Démarrer le service', action: onStart, disabled: false }
    : permissions?.canMarkDone
      ? {
          label: 'Déclarer le service réalisé',
          action: () => {
            setDialog('mark-done');
            return Promise.resolve(true);
          },
          disabled: !completionProofAvailable,
        }
      : permissions?.canValidate
        ? {
            label: 'Valider la réalisation',
            action: () => {
              setDialog('validate');
              return Promise.resolve(true);
            },
            disabled: false,
          }
        : null;

  return (
    <section
      className={mobileAction && dialog === null ? 'grid gap-5 pb-20 md:pb-0' : 'grid gap-5'}
    >
      {service.status === 'correction_requested' && service.correctionReason ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100">
              <Icon className="size-4" name="wrench" />
            </span>
            <div>
              <h2 className="font-extrabold">Correction demandée</h2>
              <p className="mt-1 text-sm leading-6">{service.correctionReason}</p>
              <p className="mt-2 text-xs font-semibold text-amber-800">
                Ajoutez une nouvelle preuve avant de déclarer à nouveau le
                service réalisé.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {service.status === 'awaiting_validation' ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <strong>En attente de validation</strong>
          <p className="mt-1 leading-6">
            Le prestataire a déclaré le service réalisé. Les points restent
            réservés tant que le demandeur ne valide pas.
          </p>
        </div>
      ) : null}

      {service.status === 'completed' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <strong>Service terminé</strong>
          <p className="mt-1 leading-6">
            La réalisation a été validée, le contrat est clôturé et les points
            ont été transférés.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Suivi de la réalisation
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Les étapes affichées proviennent de l’état enregistré par l’API.
              </p>
            </div>
            <Badge
              tone={
                service.status === 'completed'
                  ? 'success'
                  : service.status === 'correction_requested'
                    ? 'warning'
                    : 'info'
              }
            >
              {serviceStatusLabels[service.status]}
            </Badge>
          </div>

          <ol className="mt-6 grid gap-0">
            {timeline.map((step, index) => (
              <li
                className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3"
                key={step.label}
              >
                <div className="grid justify-items-center">
                  <span
                    className={
                      step.done
                        ? 'grid size-6 place-items-center rounded-full bg-emerald-700 text-white'
                        : 'grid size-6 place-items-center rounded-full border-2 border-slate-300 bg-white'
                    }
                  >
                    {step.done ? <Icon className="size-3.5" name="check" /> : null}
                  </span>
                  {index < timeline.length - 1 ? (
                    <span className="min-h-8 w-px bg-slate-200" />
                  ) : null}
                </div>
                <div className="pb-5">
                  <p
                    className={
                      step.done
                        ? 'text-sm font-bold text-slate-950'
                        : 'text-sm font-semibold text-slate-500'
                    }
                  >
                    {step.label}
                  </p>
                  {step.date ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(step.date, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="grid content-start gap-3">
          <h2 className="text-lg font-extrabold text-slate-950">
            Prochaine action
          </h2>
          {permissions?.canStart ? (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Le contrat est signé. Démarrez le service au début de
                l’intervention.
              </p>
              <Button disabled={busy} onClick={() => void onStart()} variant="primary">
                {pendingAction === 'start' ? 'Démarrage…' : 'Démarrer le service'}
              </Button>
            </>
          ) : null}
          {permissions?.canMarkDone ? (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Une preuve texte est requise avant la déclaration de
                réalisation.
              </p>
              <Button
                disabled={busy || !completionProofAvailable}
                onClick={() => setDialog('mark-done')}
                variant="primary"
              >
                Marquer comme réalisé
              </Button>
            </>
          ) : null}
          {permissions?.canValidate ? (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Vérifiez les preuves. La validation transfère définitivement
                les points au prestataire.
              </p>
              <Button
                disabled={busy}
                onClick={() => setDialog('validate')}
                variant="primary"
              >
                Valider la réalisation
              </Button>
              <Button
                disabled={busy}
                onClick={() => setDialog('correction')}
                variant="secondary"
              >
                Demander une correction
              </Button>
            </>
          ) : null}
          {!permissions?.canStart &&
          !permissions?.canMarkDone &&
          !permissions?.canValidate ? (
            <p className="text-sm leading-6 text-slate-600">
              Aucune action n’est requise avec votre rôle pour le moment.
            </p>
          ) : null}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Preuves de réalisation
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Les notes sont disponibles dans ce lot. Les fichiers seront
              ajoutés avec le stockage documentaire.
            </p>
          </div>
          <Badge>{proofs.length} preuve{proofs.length > 1 ? 's' : ''}</Badge>
        </div>

        {permissions?.canAddProof ? (
          <form
            className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
            onSubmit={submitProof}
          >
            <label className="grid gap-2 text-sm font-bold text-slate-900">
              Ajouter une note de réalisation
              <Textarea
                maxLength={1000}
                minLength={5}
                onChange={(event) => setProofMessage(event.target.value)}
                placeholder="Décrivez le travail réalisé ou la correction apportée…"
                required
                rows={3}
                value={proofMessage}
              />
            </label>
            <Button
              className="w-fit"
              disabled={busy || proofMessage.trim().length < 5}
              type="submit"
              variant="secondary"
            >
              {pendingAction === 'proof' ? 'Ajout…' : 'Ajouter la preuve'}
            </Button>
          </form>
        ) : null}

        <div className="mt-5">
          {proofsLoading ? (
            <LoadingState message="Chargement des preuves…" />
          ) : proofs.length === 0 ? (
            <EmptyState
              icon="contract"
              message="Le prestataire ajoutera ici une note avant de déclarer le service réalisé."
              title="Aucune preuve"
            />
          ) : (
            <ul className="grid gap-3">
              {proofs.map((proof) => (
                <li
                  className="rounded-xl border border-slate-200 p-4"
                  key={proof.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-950">
                      {proof.author?.displayName ?? 'Participant du service'}
                    </p>
                    <time className="text-xs font-semibold text-slate-500">
                      {formatDate(proof.createdAt, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {proof.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {mobileAction && dialog === null ? (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-xl md:hidden">
          <Button
            className="min-h-11 w-full"
            disabled={busy || mobileAction.disabled}
            onClick={() => void mobileAction.action()}
            variant="primary"
          >
            {mobileAction.label}
          </Button>
        </div>
      ) : null}

      <Modal
        description="Cette action confirme que la prestation peut passer à l’étape suivante."
        onClose={() => setDialog(null)}
        open={dialog === 'mark-done'}
        title="Déclarer le service réalisé"
      >
        <p className="text-sm leading-6 text-slate-700">
          Les points ne seront pas transférés maintenant. Le demandeur devra
          encore vérifier les preuves et valider.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setDialog(null)}>Annuler</Button>
          <Button
            disabled={busy}
            onClick={() => void confirmDialog()}
            variant="primary"
          >
            Confirmer la réalisation
          </Button>
        </div>
      </Modal>

      <Modal
        description="Cette action est irréversible une fois le transfert effectué."
        onClose={() => setDialog(null)}
        open={dialog === 'validate'}
        title="Valider la réalisation"
      >
        <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          En validant, {service.pricePoints ?? 0} points réservés seront
          transférés au prestataire et le contrat sera terminé.
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setDialog(null)}>Annuler</Button>
          <Button
            disabled={busy}
            onClick={() => void confirmDialog()}
            variant="primary"
          >
            Valider et transférer
          </Button>
        </div>
      </Modal>

      <Modal
        description="Le prestataire devra ajouter une nouvelle preuve avant de redéclarer le service réalisé."
        onClose={() => setDialog(null)}
        open={dialog === 'correction'}
        title="Demander une correction"
      >
        <form className="grid gap-4" onSubmit={submitCorrection}>
          <label className="grid gap-2 text-sm font-bold text-slate-900">
            Raison de la correction
            <Textarea
              maxLength={500}
              minLength={10}
              onChange={(event) => setCorrectionReason(event.target.value)}
              placeholder="Expliquez précisément ce qui doit être corrigé…"
              required
              rows={4}
              value={correctionReason}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDialog(null)}>Annuler</Button>
            <Button
              disabled={busy || correctionReason.trim().length < 10}
              type="submit"
              variant="primary"
            >
              Envoyer la demande
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
