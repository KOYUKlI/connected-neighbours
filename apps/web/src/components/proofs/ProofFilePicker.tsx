import { useId, useState } from "react";

import {
  formatFileSize,
  PROOF_FILE_ACCEPT,
  validateProofFile,
} from "../../api/proofFiles";
import { Button } from "../ui/Button";

export function ProofFilePicker({
  disabled,
  file,
  onChange,
}: {
  disabled?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-slate-900" htmlFor={inputId}>
        Pièce jointe facultative
      </label>
      <input
        accept={PROOF_FILE_ACCEPT}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-800 hover:file:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-60"
        disabled={disabled}
        id={inputId}
        onChange={(event) => {
          const next = event.target.files?.[0] ?? null;
          const nextError = next ? validateProofFile(next) : null;
          setError(nextError);
          onChange(nextError ? null : next);
        }}
        type="file"
      />
      <p className="text-xs leading-5 text-slate-500">
        Images 10 Mo, PDF 15 Mo, audio 25 Mo maximum. Un seul fichier par
        preuve.
      </p>
      {file ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-semibold text-emerald-950">
            {file.name} · {formatFileSize(file.size)}
          </span>
          <Button disabled={disabled} onClick={() => onChange(null)} size="sm">
            Retirer
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
