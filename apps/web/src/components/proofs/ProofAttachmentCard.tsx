import { useState } from "react";

import {
  formatFileSize,
  type ProofAttachment,
  type ProofFilePermissions,
  type SecureDownload,
} from "../../api/proofFiles";
import { getFriendlyError } from "../../utils/errors";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function ProofAttachmentCard({
  attachment,
  onDelete,
  onGetUrl,
  permissions,
}: {
  attachment: ProofAttachment;
  onDelete?: () => Promise<boolean>;
  onGetUrl: (disposition: "inline" | "attachment") => Promise<SecureDownload>;
  permissions: ProofFilePermissions;
}) {
  const [preview, setPreview] = useState<SecureDownload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      setPreview(await onGetUrl("inline"));
    } catch (caught) {
      setError(getFriendlyError(caught, "Impossible d’ouvrir ce fichier."));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function download() {
    setDownloadLoading(true);
    setError(null);
    try {
      const result = await onGetUrl("attachment");
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.rel = "noopener";
      link.click();
    } catch (caught) {
      setError(
        getFriendlyError(caught, "Impossible de télécharger ce fichier."),
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  async function confirmDelete() {
    if (!onDelete) return;
    setDeleting(true);
    setError(null);
    try {
      if (await onDelete()) setDeleteOpen(false);
    } catch (caught) {
      setError(getFriendlyError(caught, "Impossible de supprimer ce fichier."));
    } finally {
      setDeleting(false);
    }
  }

  if (attachment.deleted) {
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-500">
        Pièce jointe supprimée. La note et la trace de la preuve sont
        conservées.
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950">
              {attachment.originalFilename}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {fileKindLabel(attachment.fileKind)} ·{" "}
              {formatFileSize(attachment.sizeBytes)}
            </p>
            {attachment.sha256 ? (
              <p
                className="mt-1 font-mono text-[0.7rem] text-slate-500"
                title={attachment.sha256}
              >
                SHA-256 {attachment.sha256.slice(0, 12)}…
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.canPreview ? (
              <Button
                disabled={previewLoading}
                onClick={() => void openPreview()}
                size="sm"
                variant="secondary"
              >
                {previewLoading ? "Ouverture…" : "Aperçu"}
              </Button>
            ) : null}
            {permissions.canDownload ? (
              <Button
                disabled={downloadLoading}
                onClick={() => void download()}
                size="sm"
              >
                {downloadLoading ? "Téléchargement…" : "Télécharger"}
              </Button>
            ) : null}
            {permissions.canDelete && onDelete ? (
              <Button onClick={() => setDeleteOpen(true)} size="sm">
                Supprimer
              </Button>
            ) : null}
          </div>
        </div>
        {error ? (
          <p className="mt-2 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <Modal
        description="L’adresse d’accès est privée et expire automatiquement."
        onClose={() => setPreview(null)}
        open={Boolean(preview)}
        title={attachment.originalFilename}
      >
        {preview ? (
          <PreviewContent attachment={attachment} url={preview.url} />
        ) : null}
      </Modal>

      <Modal
        description="La note restera visible, mais le fichier ne pourra plus être consulté ni réutilisé."
        onClose={() => setDeleteOpen(false)}
        open={deleteOpen}
        title="Supprimer la pièce jointe"
      >
        <div className="flex justify-end gap-2">
          <Button disabled={deleting} onClick={() => setDeleteOpen(false)}>
            Annuler
          </Button>
          <Button
            disabled={deleting}
            onClick={() => void confirmDelete()}
            variant="primary"
          >
            {deleting ? "Suppression…" : "Confirmer la suppression"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function PreviewContent({
  attachment,
  url,
}: {
  attachment: ProofAttachment;
  url: string;
}) {
  if (attachment.fileKind === "image") {
    return (
      <img
        alt={`Preuve : ${attachment.originalFilename}`}
        className="max-h-[65dvh] w-full rounded-lg object-contain"
        src={url}
      />
    );
  }
  if (attachment.fileKind === "audio") {
    return <audio className="w-full" controls preload="metadata" src={url} />;
  }
  return (
    <iframe
      className="h-[65dvh] w-full rounded-lg border border-slate-200"
      src={url}
      title={`Aperçu de ${attachment.originalFilename}`}
    />
  );
}

function fileKindLabel(kind: ProofAttachment["fileKind"]) {
  if (kind === "image") return "Image";
  if (kind === "audio") return "Audio";
  return "PDF";
}
