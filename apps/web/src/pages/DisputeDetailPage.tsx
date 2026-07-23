import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  addDisputeEvidence,
  deleteDisputeEvidenceAttachment,
  getDispute,
  getDisputeEvidenceDownloadUrl,
  uploadDisputeEvidenceFile,
  type DisputeDetail,
} from "../api/disputes";
import type { ProofUploadPhase } from "../api/proofFiles";
import { getServiceProofDownloadUrl } from "../api/services";
import { ProofAttachmentCard } from "../components/proofs/ProofAttachmentCard";
import { ProofFilePicker } from "../components/proofs/ProofFilePicker";
import { ProofUploadProgress } from "../components/proofs/ProofUploadProgress";
import { PageContainer } from "../components/layout/PageContainer";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { buttonStyles } from "../components/ui/buttonStyles";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { Icon } from "../components/ui/Icon";
import { LoadingState } from "../components/ui/LoadingState";
import { Textarea } from "../components/ui/Textarea";
import {
  disputeOutcomeLabels,
  disputeReasonLabels,
  disputeResolutionLabels,
  disputeStatusLabels,
  getDisputeTone,
} from "../features/disputes/disputePresentation";
import { getFriendlyError } from "../utils/errors";
import { formatDate } from "../utils/format";

const historyLabels: Record<string, string> = {
  opened: "Litige ouvert",
  evidence_added: "Preuve ajoutée",
  moderator_assigned: "Modérateur assigné",
  review_started: "Revue commencée",
  financial_operation_completed: "Opération financière exécutée",
  resolved: "Décision rendue",
  closed: "Litige clôturé",
};

export function DisputeDetailPage() {
  const { disputeId = "" } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<ProofUploadPhase | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();

  const load = useCallback(async () => {
    if (!disputeId) return;
    setError(null);
    try {
      setDispute(await getDispute(disputeId));
    } catch (caught) {
      setError(getFriendlyError(caught, "Impossible de charger ce litige."));
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const message = String(data.get("message") ?? "").trim();
    if (!message && !evidenceFile) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const fileId = evidenceFile
        ? await uploadDisputeEvidenceFile(
            disputeId,
            evidenceFile,
            (phase, progress) => {
              setUploadPhase(phase);
              setUploadProgress(progress);
            },
          )
        : undefined;
      await addDisputeEvidence(disputeId, {
        message: message || undefined,
        fileId,
      });
      form.reset();
      setEvidenceFile(null);
      setSuccess("Votre preuve a été ajoutée au dossier.");
      await load();
    } catch (caught) {
      setError(getFriendlyError(caught, "Impossible d’ajouter cette preuve."));
    } finally {
      setUploadPhase(null);
      setUploadProgress(undefined);
      setPending(false);
    }
  }

  async function handleDeleteEvidence(evidenceId: string) {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteDisputeEvidenceAttachment(disputeId, evidenceId);
      setSuccess("La pièce jointe a été supprimée. La trace reste au dossier.");
      await load();
      return true;
    } catch (caught) {
      setError(
        getFriendlyError(caught, "Impossible de supprimer cette pièce jointe."),
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Chargement du litige…" />
      </PageContainer>
    );
  }

  if (!dispute) {
    return (
      <PageContainer className="grid gap-4">
        {error ? <ErrorMessage message={error} /> : null}
        <Link className={buttonStyles("ghost", "sm", "w-fit")} to="/disputes">
          Retour à mes litiges
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="grid gap-6">
      <button
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        onClick={() => navigate(-1)}
        type="button"
      >
        <Icon className="size-4" name="arrow-left" />
        Retour
      </button>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {success}
        </div>
      ) : null}

      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={getDisputeTone(dispute.status)}>
              {disputeStatusLabels[dispute.status]}
            </Badge>
            <span className="text-sm font-semibold text-slate-500">
              {dispute.reservedPoints} points gelés
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            {dispute.service.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {disputeReasonLabels[dispute.reason]} · ouvert le{" "}
            {formatDate(dispute.openedAt)}
          </p>
        </div>
        <Link
          className={buttonStyles("ghost", "md")}
          to={"/services/" + dispute.serviceId}
        >
          Voir le service
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-extrabold text-slate-950">
              Motif de la contestation
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
              {dispute.description}
            </p>
            {dispute.requestedOutcome ? (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <strong>Résultat demandé :</strong>{" "}
                {disputeOutcomeLabels[dispute.requestedOutcome]}
              </p>
            ) : null}
          </Card>

          {dispute.resolution ? (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <Badge tone="success">Décision de modération</Badge>
              <h2 className="mt-3 text-lg font-extrabold text-slate-950">
                {disputeResolutionLabels[dispute.resolution.type]}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {dispute.resolution.justification}
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3">
                  <dt className="text-xs font-semibold text-slate-500">
                    Versés au prestataire
                  </dt>
                  <dd className="mt-1 font-extrabold text-slate-950">
                    {dispute.resolution.providerPoints} points
                  </dd>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <dt className="text-xs font-semibold text-slate-500">
                    Restitués au demandeur
                  </dt>
                  <dd className="mt-1 font-extrabold text-slate-950">
                    {dispute.resolution.requesterPoints} points
                  </dd>
                </div>
              </dl>
            </Card>
          ) : null}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Preuves du litige
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Les deux parties et la modération partagent le même dossier.
                </p>
              </div>
              <Badge>{dispute.evidence.length}</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {dispute.evidence.map((item) => (
                <article
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-slate-950">
                      {item.author?.displayName ?? "Participant"}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {item.message ?? "Document associé"}
                  </p>
                  {item.attachment ? (
                    <ProofAttachmentCard
                      attachment={item.attachment}
                      onDelete={
                        item.permissions.canDelete
                          ? () => handleDeleteEvidence(item.id)
                          : undefined
                      }
                      onGetUrl={(disposition) =>
                        getDisputeEvidenceDownloadUrl(
                          dispute.id,
                          item.id,
                          disposition,
                        )
                      }
                      permissions={item.permissions}
                    />
                  ) : item.fileReference ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Ancienne référence de fichier conservée pour l’historique.
                    </p>
                  ) : null}
                </article>
              ))}
              {dispute.evidence.length === 0 ? (
                <EmptyState
                  icon="contract"
                  message="Ajoutez une note factuelle pour aider à l’examen."
                  title="Aucune preuve de litige"
                />
              ) : null}
            </div>
            {dispute.permissions.canAddDisputeEvidence ? (
              <form
                className="mt-5 grid gap-3 border-t border-slate-200 pt-5"
                onSubmit={handleEvidence}
              >
                <label className="grid gap-2 text-sm font-bold text-slate-900">
                  Description de la preuve
                  <Textarea
                    maxLength={2000}
                    name="message"
                    placeholder="Décrivez un fait ou ajoutez une précision… (facultatif avec un fichier)"
                    rows={4}
                  />
                </label>
                <ProofFilePicker
                  disabled={pending}
                  file={evidenceFile}
                  onChange={setEvidenceFile}
                />
                {uploadPhase ? (
                  <ProofUploadProgress
                    phase={uploadPhase}
                    progress={uploadProgress}
                  />
                ) : null}
                <Button
                  className="w-fit"
                  disabled={pending}
                  type="submit"
                  variant="secondary"
                >
                  {pending ? "Ajout…" : "Ajouter au dossier"}
                </Button>
              </form>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-lg font-extrabold text-slate-950">
              Preuves de réalisation
            </h2>
            <div className="mt-4 grid gap-3">
              {dispute.serviceProofs.map((proof) => (
                <article
                  className="rounded-lg border border-slate-200 p-4"
                  key={proof.id}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <strong className="text-sm text-slate-950">
                      {proof.author?.displayName ?? "Participant"}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {formatDate(proof.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {proof.message ?? "Document associé"}
                  </p>
                  {proof.attachment ? (
                    <ProofAttachmentCard
                      attachment={proof.attachment}
                      onGetUrl={(disposition) =>
                        getServiceProofDownloadUrl(
                          dispute.serviceId,
                          proof.id,
                          disposition,
                        )
                      }
                      permissions={{ ...proof.permissions, canDelete: false }}
                    />
                  ) : null}
                </article>
              ))}
              {dispute.serviceProofs.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune preuve de réalisation n’avait été ajoutée.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <aside className="grid content-start gap-5">
          <Card>
            <h2 className="font-extrabold text-slate-950">Dossier</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Demandeur</dt>
                <dd className="mt-1 text-slate-950">
                  {dispute.requester?.displayName ?? "Utilisateur inconnu"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Prestataire</dt>
                <dd className="mt-1 text-slate-950">
                  {dispute.provider?.displayName ?? "Utilisateur inconnu"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Modérateur</dt>
                <dd className="mt-1 text-slate-950">
                  {dispute.assignedModerator?.displayName ?? "Non assigné"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="font-extrabold text-slate-950">Historique</h2>
            <ol className="mt-4 grid gap-4 border-l-2 border-emerald-100 pl-4">
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
    </PageContainer>
  );
}
