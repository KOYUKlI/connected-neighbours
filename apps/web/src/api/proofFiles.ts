import { apiRequest } from "./client";

export type ProofFileKind = "image" | "document" | "audio";
export type ProofAttachment = {
  fileId: string;
  fileKind: ProofFileKind;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  deleted: boolean;
  deletedAt: string | null;
};

export type ProofFilePermissions = {
  canPreview: boolean;
  canDownload: boolean;
  canDelete: boolean;
};

export type ProofUploadPhase =
  | "preparing"
  | "uploading"
  | "verifying"
  | "linking";

type PresignedUpload = {
  fileId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
};

export type SecureDownload = {
  url: string;
  expiresAt: string;
  filename: string;
  disposition: "inline" | "attachment";
};

const FILE_RULES: Record<string, { maxBytes: number; label: string }> = {
  "image/jpeg": { maxBytes: 10 * 1024 * 1024, label: "Image JPEG" },
  "image/png": { maxBytes: 10 * 1024 * 1024, label: "Image PNG" },
  "image/webp": { maxBytes: 10 * 1024 * 1024, label: "Image WebP" },
  "application/pdf": { maxBytes: 15 * 1024 * 1024, label: "Document PDF" },
  "audio/mpeg": { maxBytes: 25 * 1024 * 1024, label: "Audio MP3" },
  "audio/ogg": { maxBytes: 25 * 1024 * 1024, label: "Audio OGG" },
  "audio/wav": { maxBytes: 25 * 1024 * 1024, label: "Audio WAV" },
  "audio/x-wav": { maxBytes: 25 * 1024 * 1024, label: "Audio WAV" },
  "audio/webm": { maxBytes: 25 * 1024 * 1024, label: "Audio WebM" },
};

export const PROOF_FILE_ACCEPT = Object.keys(FILE_RULES).join(",");

export function validateProofFile(file: File) {
  const rule = FILE_RULES[file.type];
  if (!rule) {
    return "Formats acceptés : JPEG, PNG, WebP, PDF, MP3, OGG, WAV ou WebM audio.";
  }
  if (file.size === 0 || file.size > rule.maxBytes) {
    return `${rule.label} : taille maximale ${Math.floor(rule.maxBytes / 1024 / 1024)} Mo.`;
  }
  return null;
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} o`;
  if (sizeBytes < 1024 * 1024) return `${Math.ceil(sizeBytes / 1024)} Ko`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} Mo`;
}

export async function uploadProofFile(
  presignPath: string,
  file: File,
  onPhase: (phase: ProofUploadPhase, progress?: number) => void,
) {
  const validationError = validateProofFile(file);
  if (validationError) throw new Error(validationError);

  onPhase("preparing");
  const instruction = await apiRequest<PresignedUpload>(presignPath, {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });
  onPhase("uploading", 0);
  await putPresignedFile(instruction, file, (progress) =>
    onPhase("uploading", progress),
  );
  onPhase("verifying");
  await apiRequest(`/api/storage/files/${instruction.fileId}/complete`, {
    method: "POST",
  });
  onPhase("linking");
  return instruction.fileId;
}

function putPresignedFile(
  instruction: PresignedUpload,
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(instruction.method, instruction.uploadUrl);
    Object.entries(instruction.headers).forEach(([name, value]) => {
      request.setRequestHeader(name, value);
    });
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("Le transfert du fichier a échoué."));
    });
    request.addEventListener("error", () =>
      reject(new Error("Le stockage du fichier est inaccessible.")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("Le transfert du fichier a été interrompu.")),
    );
    request.send(file);
  });
}
