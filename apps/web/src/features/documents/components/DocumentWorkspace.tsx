import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  cancelDocument,
  getDocumentDownloadUrl,
  saveDocumentFields,
  sendDocumentForSignature,
  signDocument,
  type DocumentFileVariant,
  type DocumentItem,
} from "../../../api/documents";
import { useAuth } from "../../../auth/useAuth";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Tabs } from "../../../components/ui/Tabs";
import { getErrorMessage } from "../../../shared/utils/errors";
import { formatDate } from "../../../utils/format";
import {
  documentFieldLabels,
  documentStatusLabels,
  formatDocumentAction,
  getDocumentTone,
} from "../documentPresentation";
import { DocumentFieldEditor, PdfObject } from "./DocumentFieldEditor";

type WorkspaceTab = "preview" | "prepare" | "signature" | "history";

type PreviewState = {
  url: string;
  variant: DocumentFileVariant;
  expiresAt: string;
} | null;

export function DocumentWorkspace({
  document,
  onChange,
}: {
  document: DocumentItem;
  onChange: (document: DocumentItem) => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<WorkspaceTab>("preview");
  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const preferredVariant: DocumentFileVariant = document.files.final
    ? "final"
    : "current";
  const loadPreview = useCallback(
    async (variant: DocumentFileVariant = preferredVariant) => {
      setPreviewLoading(true);
      setError(null);
      try {
        const response = await getDocumentDownloadUrl(
          document.id,
          variant,
          "inline",
        );
        setPreview({
          url: response.url,
          variant,
          expiresAt: response.expiresAt,
        });
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setPreviewLoading(false);
      }
    },
    [document.id, preferredVariant],
  );

  useEffect(() => {
    void loadPreview();
  }, [loadPreview, document.version]);
  useEffect(() => {
    if (document.permissions.canSign) setTab("signature");
  }, [document.id, document.permissions.canSign]);

  const tabs = useMemo(
    () => [
      { id: "preview" as const, label: "Aperçu" },
      ...(document.permissions.canPrepareDocument
        ? [{ id: "prepare" as const, label: "Préparation" }]
        : []),
      {
        id: "signature" as const,
        label: "Signatures",
        count: `${document.progress.signed}/${document.progress.total}`,
      },
      { id: "history" as const, label: "Historique" },
    ],
    [
      document.permissions.canPrepareDocument,
      document.progress.signed,
      document.progress.total,
    ],
  );

  async function runAction(
    label: string,
    action: () => Promise<DocumentItem>,
    success: string,
  ) {
    setPending(label);
    setError(null);
    setNotice(null);
    try {
      const next = await action();
      onChange(next);
      setNotice(success);
      return true;
    } catch (caught) {
      setError(getErrorMessage(caught));
      return false;
    } finally {
      setPending(null);
    }
  }

  async function download(variant: DocumentFileVariant) {
    setPending(`download-${variant}`);
    setError(null);
    try {
      const response = await getDocumentDownloadUrl(
        document.id,
        variant,
        "attachment",
      );
      window.location.assign(response.url);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={getDocumentTone(document.status)}>
                {documentStatusLabels[document.status]}
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                Version {document.version}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              {document.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {document.service?.title ?? "Service lié"} ·{" "}
              {document.contract?.pricePoints ?? 0} points
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {document.permissions.canDownloadOriginal ? (
              <Button
                disabled={pending === "download-original"}
                onClick={() => void download("original")}
              >
                Original
              </Button>
            ) : null}
            {document.permissions.canDownloadCurrent ? (
              <Button
                disabled={pending === "download-current"}
                onClick={() => void download("current")}
              >
                Révision
              </Button>
            ) : null}
            {document.permissions.canDownloadFinal ? (
              <Button
                disabled={pending === "download-final"}
                onClick={() => void download("final")}
                variant="primary"
              >
                PDF final
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-xs text-slate-500">Demandeur</span>
            <strong className="mt-1 block text-slate-950">
              {document.contract?.requester?.displayName ?? "Non disponible"}
            </strong>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Prestataire</span>
            <strong className="mt-1 block text-slate-950">
              {document.contract?.provider?.displayName ?? "Non disponible"}
            </strong>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Progression</span>
            <strong className="mt-1 block text-slate-950">
              {document.progress.signed} signature
              {document.progress.signed > 1 ? "s" : ""} sur{" "}
              {document.progress.total}
            </strong>
          </div>
        </div>
      </Card>

      {error ? <ErrorMessage message={error} /> : null}
      {notice ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <Tabs
        items={tabs}
        label="Document contractuel"
        onChange={setTab}
        value={tab}
      />

      {tab === "preview" ? (
        <Card className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Aperçu du PDF
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Lien privé temporaire, renouvelé à la demande.
              </p>
            </div>
            <Button
              disabled={previewLoading}
              onClick={() => void loadPreview(preferredVariant)}
            >
              Renouveler l’aperçu
            </Button>
          </div>
          {previewLoading ? (
            <div className="grid min-h-80 place-items-center rounded-lg bg-slate-50 text-sm text-slate-500">
              Chargement du PDF…
            </div>
          ) : null}
          {!previewLoading && preview ? (
            <PdfObject
              className="min-h-[38rem] w-full rounded-lg border border-slate-200 bg-slate-50 max-sm:min-h-[28rem]"
              title={`Aperçu de ${document.title}`}
              url={preview.url}
            />
          ) : null}
          {preview ? (
            <p className="text-xs text-slate-500">
              Version affichée :{" "}
              {preview.variant === "final"
                ? "finale"
                : preview.variant === "current"
                  ? "révision courante"
                  : "originale"}{" "}
              · URL valable jusqu’à {formatDate(preview.expiresAt)}
            </p>
          ) : null}
        </Card>
      ) : null}

      {tab === "prepare" && document.permissions.canPrepareDocument ? (
        <Card className="grid gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Préparer les champs
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Les positions sont enregistrées entre 0 et 1 pour rester
                indépendantes de l’écran.
              </p>
            </div>
            {document.permissions.canSendForSignature ? (
              <Button
                disabled={pending === "send"}
                onClick={() =>
                  void runAction(
                    "send",
                    () => sendDocumentForSignature(document.id),
                    "Le document a été envoyé aux deux parties.",
                  )
                }
                variant="primary"
              >
                Envoyer en signature
              </Button>
            ) : null}
          </div>
          <DocumentFieldEditor
            key={document.id + "-" + document.version}
            document={document}
            pending={pending === "fields"}
            previewUrl={preview?.url ?? null}
            onSave={(fields) =>
              runAction(
                "fields",
                () => saveDocumentFields(document.id, fields),
                "Les zones ont été enregistrées.",
              ).then(() => undefined)
            }
          />
        </Card>
      ) : null}

      {tab === "signature" ? (
        <Card className="grid gap-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Signatures des parties
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chaque personne signe uniquement les champs qui lui sont assignés.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {document.signers.map((signer) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                key={signer.userId}
              >
                <div>
                  <strong className="block text-slate-950">
                    {signer.profile?.displayName ?? "Partie au contrat"}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {signer.signedAt
                      ? `Signé le ${formatDate(signer.signedAt)}`
                      : "Signature attendue"}
                  </span>
                </div>
                <Badge
                  tone={signer.status === "signed" ? "success" : "warning"}
                >
                  {signer.status === "signed" ? "Signé" : "À signer"}
                </Badge>
              </div>
            ))}
          </div>
          {document.permissions.canSign ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <strong className="text-amber-950">
                Votre signature est attendue
              </strong>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Vous allez consentir à une signature applicative horodatée. Une
                nouvelle révision du PDF sera créée.
              </p>
              <Button
                className="mt-3"
                onClick={() => setSignatureOpen(true)}
                variant="primary"
              >
                Relire et signer
              </Button>
            </div>
          ) : null}
          {!document.permissions.canSign &&
          document.status === "partially_signed" ? (
            <p className="text-sm text-slate-600">
              Votre signature est enregistrée. Le document attend encore l’autre
              partie.
            </p>
          ) : null}
          {["finalized", "archived"].includes(document.status) ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <strong className="block">Document finalisé</strong>
              <span className="mt-1 block">
                Le contrat est actif et le PDF final est scellé par une
                empreinte SHA-256.
              </span>
            </div>
          ) : null}
          <div className="rounded-lg bg-slate-950 p-4 text-xs text-slate-200">
            <span className="font-bold text-white">
              Empreinte {document.hashes.final ? "finale" : "courante"}
            </span>
            <code className="mt-2 block break-all font-mono">
              {document.hashes.final ?? document.hashes.current}
            </code>
          </div>
        </Card>
      ) : null}

      {tab === "history" ? (
        <Card>
          <h2 className="text-lg font-extrabold text-slate-950">
            Historique documentaire
          </h2>
          <ol className="mt-5 grid gap-0">
            {document.auditTrail.map((entry, index) => (
              <li
                className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-5"
                key={`${entry.action}-${entry.at}-${index}`}
              >
                <span className="relative z-10 mt-1 size-3 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
                {index < document.auditTrail.length - 1 ? (
                  <span className="absolute left-[0.35rem] top-4 h-full w-px bg-slate-200" />
                ) : null}
                <div>
                  <strong className="block text-sm text-slate-950">
                    {formatDocumentAction(entry.action)}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {formatDate(entry.at)}
                  </span>
                  {entry.metadata?.reference ? (
                    <span className="mt-1 block font-mono text-xs text-slate-500">
                      {String(entry.metadata.reference)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      {document.permissions.canCancel ? (
        <div className="flex justify-end">
          <Button
            disabled={pending === "cancel"}
            onClick={() =>
              void runAction(
                "cancel",
                () => cancelDocument(document.id),
                "Le document a été annulé.",
              )
            }
            variant="danger"
          >
            Annuler ce document
          </Button>
        </div>
      ) : null}

      <SignatureModal
        document={document}
        onClose={() => setSignatureOpen(false)}
        onSigned={(next) => {
          setSignatureOpen(false);
          onChange(next);
          setNotice(
            "Votre signature a été enregistrée dans une nouvelle révision.",
          );
          setTab("signature");
        }}
        open={signatureOpen}
        signerId={user?.id ?? ""}
        signerName={user?.displayName ?? ""}
      />
    </div>
  );
}

function SignatureModal({
  document,
  onClose,
  onSigned,
  open,
  signerId,
  signerName,
}: {
  document: DocumentItem;
  onClose: () => void;
  onSigned: (document: DocumentItem) => void;
  open: boolean;
  signerId: string;
  signerName: string;
}) {
  const { handleSessionError } = useAuth();
  const [signatureText, setSignatureText] = useState(signerName);
  const [consent, setConsent] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const effectiveFields = document.fields.filter(
    (field) => !field.signedAt && field.assignedToUserId === signerId,
  );

  useEffect(() => {
    if (open) {
      setSignatureText(signerName);
      setConsent(false);
      setValues({});
      setError(null);
    }
  }, [open, signerName]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!consent) {
      setError("Votre consentement explicite est requis.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await signDocument(document.id, {
        signatureText,
        values: effectiveFields
          .filter((field) =>
            ["initials", "text", "checkbox"].includes(field.type),
          )
          .map((field) => ({
            fieldId: field.id,
            value: values[field.id] ?? (field.type === "checkbox" ? false : ""),
          })),
      });
      onSigned(result);
    } catch (caught) {
      if (!handleSessionError(caught)) setError(getErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      description="Cette action crée une révision horodatée et ne constitue pas une signature électronique qualifiée."
      onClose={onClose}
      open={open}
      title="Signer le document"
    >
      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Nom affiché dans la signature
          <Input
            minLength={2}
            onChange={(event) => setSignatureText(event.target.value)}
            required
            value={signatureText}
          />
        </label>
        {effectiveFields
          .filter((field) =>
            ["initials", "text", "checkbox"].includes(field.type),
          )
          .map((field) =>
            field.type === "checkbox" ? (
              <label
                className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800"
                key={field.id}
              >
                <input
                  checked={values[field.id] === true}
                  className="size-5 accent-emerald-700"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.checked,
                    }))
                  }
                  required={field.required}
                  type="checkbox"
                />
                {field.label ?? documentFieldLabels[field.type]}
              </label>
            ) : (
              <label
                className="grid gap-2 text-sm font-bold text-slate-900"
                key={field.id}
              >
                {field.label ?? documentFieldLabels[field.type]}
                <Input
                  maxLength={field.type === "initials" ? 12 : 500}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }))
                  }
                  required={field.required}
                  value={String(values[field.id] ?? "")}
                />
              </label>
            ),
          )}
        <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <input
            checked={consent}
            className="mt-0.5 size-5 shrink-0 accent-emerald-700"
            onChange={(event) => setConsent(event.target.checked)}
            type="checkbox"
          />
          Je confirme avoir lu le document et j’accepte d’apposer ma signature
          applicative horodatée.
        </label>
        {error ? <ErrorMessage message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={pending || !consent}
            type="submit"
            variant="primary"
          >
            {pending ? "Signature en cours…" : "Signer le PDF"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
