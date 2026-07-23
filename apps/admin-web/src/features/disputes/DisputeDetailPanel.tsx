import { useCallback, useEffect, useState } from "react";

import {
  assignAdminDispute,
  closeAdminDispute,
  fetchAdminDispute,
  fetchAdminDisputeEvidenceDownload,
  fetchAdminServiceProofDownload,
  resolveAdminDispute,
  startAdminDisputeReview,
  type AdminDisputeDetail,
  type AdminDisputeResolutionType,
} from "../../api/disputes";
import { AdminBadge } from "../../components/ui/AdminList";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import { ApiError } from "../../api/client";
import { DisputeResolutionModal } from "./DisputeResolutionModal";
import { AdminProofAttachmentCard } from "./AdminProofAttachmentCard";

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  under_review: "En cours de revue",
  resolved: "Résolu",
  closed: "Clôturé",
};
const reasonLabels: Record<string, string> = {
  service_not_completed: "Service non réalisé",
  service_quality: "Qualité de la prestation",
  no_show: "Absence au rendez-vous",
  incorrect_description: "Description inexacte",
  unsafe_behavior: "Comportement dangereux",
  payment_disagreement: "Désaccord sur le paiement",
  other: "Autre motif",
};
const historyLabels: Record<string, string> = {
  opened: "Litige ouvert",
  evidence_added: "Preuve ajoutée",
  moderator_assigned: "Modérateur assigné",
  review_started: "Revue commencée",
  financial_operation_completed: "Opération financière exécutée",
  resolved: "Décision rendue",
  closed: "Litige clôturé",
};

export function DisputeDetailPanel({
  disputeId,
  onBack,
  onChanged,
}: {
  disputeId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [dispute, setDispute] = useState<AdminDisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDispute(await fetchAdminDispute(disputeId));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    key: string,
    action: () => Promise<AdminDisputeDetail>,
    message: string,
  ) {
    setPending(key);
    setError(null);
    setSuccess(null);
    try {
      setDispute(await action());
      setSuccess(message);
      onChanged();
      return true;
    } catch (caught) {
      setError(getErrorMessage(caught));
      return false;
    } finally {
      setPending(null);
    }
  }

  if (loading) return <LoadingState message="Chargement du dossier…" />;
  if (!dispute) {
    return (
      <div className="grid gap-4">
        {error ? <ErrorMessage message={error} /> : null}
        <Button className="w-fit" onClick={onBack}>
          Retour aux litiges
        </Button>
      </div>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            className="mb-3 inline-flex min-h-10 items-center text-sm font-bold text-slate-500 hover:text-blue-700"
            onClick={onBack}
            type="button"
          >
            ← Retour aux litiges
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge tone={getStatusTone(dispute.status)}>
              {statusLabels[dispute.status]}
            </AdminBadge>
            <span className="text-sm font-medium text-slate-500">
              {dispute.reservedPoints} points gelés
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            {dispute.service.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {reasonLabels[dispute.reason]} · ouvert le{" "}
            {formatDate(dispute.openedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dispute.permissions.canAssignDispute ? (
            <Button
              disabled={pending !== null}
              onClick={() =>
                void runAction(
                  "assign",
                  () => assignAdminDispute(dispute.id),
                  "Le litige vous est assigné.",
                )
              }
              variant="secondary"
            >
              {dispute.assignedModerator ? "Réassigner à moi" : "M’assigner"}
            </Button>
          ) : null}
          {dispute.permissions.canStartReview ? (
            <Button
              disabled={pending !== null}
              onClick={() =>
                void runAction(
                  "review",
                  () => startAdminDisputeReview(dispute.id),
                  "La revue a commencé.",
                )
              }
              variant="primary"
            >
              Démarrer la revue
            </Button>
          ) : null}
          {dispute.permissions.canResolveDispute ? (
            <Button
              disabled={pending !== null}
              onClick={() => setResolutionOpen(true)}
              variant="danger"
            >
              Rendre une décision
            </Button>
          ) : null}
          {dispute.permissions.canCloseDispute ? (
            <Button
              disabled={pending !== null}
              onClick={() =>
                void runAction(
                  "close",
                  () => closeAdminDispute(dispute.id),
                  "Le litige est clôturé.",
                )
              }
              variant="primary"
            >
              Clôturer
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {success}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Contestation</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
              {dispute.description}
            </p>
          </Card>

          {dispute.resolution ? (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <AdminBadge tone="emerald">Décision enregistrée</AdminBadge>
              <h2 className="mt-3 text-lg font-bold text-slate-950">
                {formatResolution(dispute.resolution.type)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {dispute.resolution.justification}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Prestataire"
                  value={dispute.resolution.providerPoints + " points"}
                />
                <Metric
                  label="Demandeur"
                  value={dispute.resolution.requesterPoints + " points"}
                />
              </div>
            </Card>
          ) : null}

          <EvidenceSection
            empty="Aucune preuve spécifique au litige."
            getUrl={(evidenceId, disposition) =>
              fetchAdminDisputeEvidenceDownload(
                dispute.id,
                evidenceId,
                disposition,
              )
            }
            items={dispute.evidence}
            title="Preuves du litige"
          />
          <EvidenceSection
            empty="Aucune preuve de réalisation."
            getUrl={(proofId, disposition) =>
              fetchAdminServiceProofDownload(
                dispute.serviceId,
                proofId,
                disposition,
              )
            }
            items={dispute.serviceProofs}
            title="Preuves de réalisation"
          />
        </div>

        <aside className="grid content-start gap-5">
          <Card>
            <h2 className="font-bold text-slate-950">Informations clés</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <Info label="Demandeur" value={dispute.requester?.displayName} />
              <Info label="Prestataire" value={dispute.provider?.displayName} />
              <Info
                label="Modérateur"
                value={dispute.assignedModerator?.displayName ?? "Non assigné"}
              />
              <Info
                label="Contrat"
                value={
                  dispute.contract.status +
                  " · " +
                  dispute.contract.pricePoints +
                  " points"
                }
              />
              <Info
                label="Ancien statut du service"
                value={dispute.previousServiceStatus}
              />
            </dl>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-950">Chronologie</h2>
            <ol className="mt-4 grid gap-4 border-l-2 border-blue-100 pl-4">
              {dispute.history.map((event, index) => (
                <li key={event.type + "-" + index}>
                  <p className="text-sm font-bold text-slate-950">
                    {historyLabels[event.type] ?? event.type}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(event.occurredAt)} ·{" "}
                    {event.actor?.displayName ?? "Système"}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      <DisputeResolutionModal
        onClose={() => setResolutionOpen(false)}
        onSubmit={(input) =>
          runAction(
            "resolve",
            () => resolveAdminDispute(dispute.id, input),
            "La décision financière a été exécutée.",
          )
        }
        open={resolutionOpen}
        pending={pending === "resolve"}
        reservedPoints={dispute.reservedPoints}
      />
    </section>
  );
}

function EvidenceSection({
  empty,
  getUrl,
  items,
  title,
}: {
  empty: string;
  getUrl: (
    itemId: string,
    disposition: "inline" | "attachment",
  ) => ReturnType<typeof fetchAdminDisputeEvidenceDownload>;
  items: AdminDisputeDetail["evidence"];
  title: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <AdminBadge>{items.length}</AdminBadge>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={item.id}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="text-sm text-slate-950">
                {item.author?.displayName ?? "Participant"}
              </strong>
              <span className="text-xs text-slate-500">
                {formatDate(item.createdAt)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {item.message ?? item.fileReference ?? "Document associé"}
            </p>
            {item.attachment && item.permissions.canPreview ? (
              <AdminProofAttachmentCard
                attachment={item.attachment}
                onGetUrl={(disposition) => getUrl(item.id, disposition)}
              />
            ) : null}
          </article>
        ))}
        {items.length === 0 ? <EmptyState message={empty} /> : null}
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value ?? "—"}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatResolution(type: AdminDisputeResolutionType) {
  if (type === "provider_payment") return "Paiement intégral du prestataire";
  if (type === "requester_refund") return "Remboursement intégral du demandeur";
  return "Partage des points";
}

function getStatusTone(status: string) {
  if (status === "resolved" || status === "closed") return "emerald" as const;
  if (status === "under_review") return "blue" as const;
  return "amber" as const;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "Une erreur inattendue est survenue.";
}
