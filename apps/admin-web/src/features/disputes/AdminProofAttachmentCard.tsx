import { useState } from "react";

import {
  type AdminProofAttachment,
  type AdminSecureDownload,
} from "../../api/disputes";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export function AdminProofAttachmentCard({
  attachment,
  onGetUrl,
}: {
  attachment: AdminProofAttachment;
  onGetUrl: (
    disposition: "inline" | "attachment",
  ) => Promise<AdminSecureDownload>;
}) {
  const [preview, setPreview] = useState<AdminSecureDownload | null>(null);
  const [pending, setPending] = useState<"preview" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openPreview() {
    setPending("preview");
    setError(null);
    try {
      setPreview(await onGetUrl("inline"));
    } catch {
      setError("Impossible d’ouvrir cette pièce jointe.");
    } finally {
      setPending(null);
    }
  }

  async function download() {
    setPending("download");
    setError(null);
    try {
      const result = await onGetUrl("attachment");
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.rel = "noopener";
      link.click();
    } catch {
      setError("Impossible de télécharger cette pièce jointe.");
    } finally {
      setPending(null);
    }
  }

  if (attachment.deleted) {
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500">
        Pièce jointe supprimée par son auteur.
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
              {formatKind(attachment.fileKind)} ·{" "}
              {formatSize(attachment.sizeBytes)}
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
            <Button
              disabled={pending !== null}
              onClick={() => void openPreview()}
              size="sm"
            >
              {pending === "preview" ? "Ouverture…" : "Aperçu"}
            </Button>
            <Button
              disabled={pending !== null}
              onClick={() => void download()}
              size="sm"
              variant="secondary"
            >
              {pending === "download" ? "Téléchargement…" : "Télécharger"}
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
        ) : null}
      </div>

      <Modal
        description="Accès privé temporaire au fichier vérifié."
        onClose={() => setPreview(null)}
        open={Boolean(preview)}
        title={attachment.originalFilename}
      >
        {preview ? <Preview attachment={attachment} url={preview.url} /> : null}
      </Modal>
    </>
  );
}

function Preview({
  attachment,
  url,
}: {
  attachment: AdminProofAttachment;
  url: string;
}) {
  if (attachment.fileKind === "image") {
    return (
      <img
        alt={attachment.originalFilename}
        className="max-h-[65dvh] w-full object-contain"
        src={url}
      />
    );
  }
  if (attachment.fileKind === "audio") {
    return <audio className="w-full" controls preload="metadata" src={url} />;
  }
  return (
    <iframe
      className="h-[65dvh] w-full border-0"
      src={url}
      title={attachment.originalFilename}
    />
  );
}

function formatKind(kind: AdminProofAttachment["fileKind"]) {
  if (kind === "image") return "Image";
  if (kind === "audio") return "Audio";
  return "PDF";
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
