import type { ProofUploadPhase } from "../../api/proofFiles";

const labels: Record<ProofUploadPhase, string> = {
  preparing: "Préparation du dépôt sécurisé…",
  uploading: "Envoi vers le stockage privé…",
  verifying: "Vérification du format et de l’empreinte…",
  linking: "Association de la preuve…",
};

export function ProofUploadProgress({
  phase,
  progress,
}: {
  phase: ProofUploadPhase;
  progress?: number;
}) {
  const value = phase === "uploading" ? (progress ?? 0) : undefined;
  return (
    <div
      className="grid gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3"
      role="status"
    >
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-blue-950">
        <span>{labels[phase]}</span>
        {value !== undefined ? <span>{value}%</span> : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-blue-100">
        <div
          className={
            value === undefined
              ? "h-full w-1/2 animate-pulse rounded-full bg-blue-600"
              : "h-full rounded-full bg-blue-600 transition-[width]"
          }
          style={value === undefined ? undefined : { width: `${value}%` }}
        />
      </div>
    </div>
  );
}
