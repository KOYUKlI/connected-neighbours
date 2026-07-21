import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  type DocumentField,
  type DocumentFieldType,
  type DocumentItem,
} from "../../../api/documents";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { documentFieldLabels } from "../documentPresentation";

type PointerOperation = {
  fieldId: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  initial: DocumentField;
} | null;

export function DocumentFieldEditor({
  document,
  onSave,
  pending,
  previewUrl,
}: {
  document: DocumentItem;
  onSave: (fields: DocumentField[]) => Promise<void>;
  pending: boolean;
  previewUrl: string | null;
}) {
  const [fields, setFields] = useState(document.fields);
  const [pageNumber, setPageNumber] = useState(1);
  const [fieldType, setFieldType] = useState<DocumentFieldType>("signature");
  const [assignedToUserId, setAssignedToUserId] = useState(
    document.contract?.requester?.id ?? "",
  );
  const [required, setRequired] = useState(true);
  const [adding, setAdding] = useState(false);
  const [operation, setOperation] = useState<PointerOperation>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const visibleFields = fields.filter(
    (field) => field.pageNumber === pageNumber,
  );

  function placeField(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      !adding ||
      !pageRef.current ||
      (event.target as HTMLElement).closest("[data-document-field]")
    )
      return;
    const rect = pageRef.current.getBoundingClientRect();
    const width = fieldType === "checkbox" ? 0.13 : 0.32;
    const height = fieldType === "signature" ? 0.1 : 0.065;
    const x = clamp(
      (event.clientX - rect.left) / rect.width - width / 2,
      0,
      1 - width,
    );
    const y = clamp(
      (event.clientY - rect.top) / rect.height - height / 2,
      0,
      1 - height,
    );
    setFields((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: fieldType,
        pageNumber,
        x,
        y,
        width,
        height,
        assignedToUserId,
        required,
        label: documentFieldLabels[fieldType],
        signedAt: null,
        value: null,
        signatureId: null,
      },
    ]);
    setAdding(false);
  }

  function startOperation(
    event: ReactPointerEvent,
    field: DocumentField,
    mode: "move" | "resize",
  ) {
    event.stopPropagation();
    setOperation({
      fieldId: field.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      initial: field,
    });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function updateOperation(event: ReactPointerEvent<HTMLDivElement>) {
    if (!operation || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const dx = (event.clientX - operation.startX) / rect.width;
    const dy = (event.clientY - operation.startY) / rect.height;
    setFields((current) =>
      current.map((field) => {
        if (field.id !== operation.fieldId) return field;
        if (operation.mode === "move") {
          return {
            ...field,
            x: clamp(operation.initial.x + dx, 0, 1 - field.width),
            y: clamp(operation.initial.y + dy, 0, 1 - field.height),
          };
        }
        return {
          ...field,
          width: clamp(operation.initial.width + dx, 0.06, 1 - field.x),
          height: clamp(operation.initial.height + dy, 0.035, 1 - field.y),
        };
      }),
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="grid content-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h3 className="font-extrabold text-slate-950">Ajouter une zone</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Choisissez le champ, puis cliquez sur le PDF.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Type
          <Select
            onChange={(event) =>
              setFieldType(event.target.value as DocumentFieldType)
            }
            value={fieldType}
          >
            {Object.entries(documentFieldLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Signataire
          <Select
            onChange={(event) => setAssignedToUserId(event.target.value)}
            value={assignedToUserId}
          >
            {document.signers.map((signer) => (
              <option key={signer.userId} value={signer.userId}>
                {signer.profile?.displayName ?? "Partie au contrat"}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            checked={required}
            className="size-5 accent-emerald-700"
            onChange={(event) => setRequired(event.target.checked)}
            type="checkbox"
          />{" "}
          Champ obligatoire
        </label>
        <Button
          disabled={!assignedToUserId}
          onClick={() => setAdding((value) => !value)}
          variant={adding ? "secondary" : "primary"}
        >
          {adding ? "Annuler le placement" : "Placer sur le PDF"}
        </Button>
        <div className="border-t border-slate-100 pt-4">
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Page
            <Select
              onChange={(event) => setPageNumber(Number(event.target.value))}
              value={pageNumber}
            >
              {Array.from({ length: document.pageCount }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Page {index + 1}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <Button
          disabled={pending}
          onClick={() => onSave(fields)}
          variant="primary"
        >
          {pending ? "Enregistrement…" : "Enregistrer les zones"}
        </Button>
      </aside>

      <div>
        <p className="mb-3 text-sm text-slate-600">
          {adding
            ? "Cliquez à l’endroit souhaité."
            : "Glissez une zone pour la déplacer. Utilisez son coin inférieur droit pour la redimensionner."}
        </p>
        <div
          className="relative mx-auto aspect-[210/297] w-full max-w-[50rem] touch-none overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg"
          onPointerMove={updateOperation}
          onPointerUp={() => setOperation(null)}
          onPointerCancel={() => setOperation(null)}
          onPointerDown={placeField}
          ref={pageRef}
        >
          <PdfObject
            className="pointer-events-none absolute inset-0 h-full w-full"
            title={`Aperçu de ${document.title}`}
            url={previewUrl}
          />
          {!previewUrl ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-50 text-sm text-slate-400">
              Chargement de la prévisualisation PDF...
            </div>
          ) : null}
          {visibleFields.map((field) => (
            <div
              className="absolute z-10 cursor-move select-none rounded border-2 border-emerald-600 bg-emerald-50/90 p-1.5 text-[11px] font-bold text-emerald-950 shadow-sm"
              data-document-field
              key={field.id}
              onPointerDown={(event) => startOperation(event, field, "move")}
              style={fieldStyle(field)}
            >
              <span className="block truncate">
                {documentFieldLabels[field.type]}
              </span>
              <span className="block truncate font-medium">
                {document.signers.find(
                  (item) => item.userId === field.assignedToUserId,
                )?.profile?.displayName ?? "Signataire"}
              </span>
              <button
                aria-label="Supprimer la zone"
                className="absolute -right-3 -top-3 grid size-7 place-items-center rounded-full bg-red-600 text-white shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                onClick={(event) => {
                  event.stopPropagation();
                  setFields((current) =>
                    current.filter((item) => item.id !== field.id),
                  );
                }}
                type="button"
              >
                ×
              </button>
              <button
                aria-label="Redimensionner la zone"
                className="absolute -bottom-2 -right-2 size-5 cursor-se-resize rounded-sm border-2 border-white bg-emerald-700 shadow"
                onPointerDown={(event) =>
                  startOperation(event, field, "resize")
                }
                type="button"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PdfObject({
  className,
  title,
  url,
}: {
  className?: string;
  title: string;
  url: string | null;
}) {
  if (!url) return null;
  return (
    <object
      aria-label={title}
      className={className}
      data={url}
      title={title}
      type="application/pdf"
    >
      <a className="font-bold text-emerald-800 underline" href={url}>
        Ouvrir le PDF
      </a>
    </object>
  );
}

function fieldStyle(field: DocumentField): CSSProperties {
  return {
    left: `${field.x * 100}%`,
    top: `${field.y * 100}%`,
    width: `${field.width * 100}%`,
    height: `${field.height * 100}%`,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
