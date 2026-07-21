import type { DocumentFieldType, DocumentStatus } from "../../api/documents";

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  uploaded: "Importé",
  prepared: "Prêt à envoyer",
  sent_for_signature: "À signer",
  partially_signed: "Partiellement signé",
  signed: "Signé",
  finalized: "Finalisé",
  archived: "Archivé",
  cancelled: "Annulé",
};

export const documentFieldLabels: Record<DocumentFieldType, string> = {
  signature: "Signature",
  initials: "Initiales",
  date: "Date",
  text: "Texte",
  checkbox: "Case à cocher",
};

export function getDocumentTone(status: DocumentStatus) {
  if (["finalized", "archived"].includes(status)) return "success" as const;
  if (["sent_for_signature", "partially_signed", "prepared"].includes(status))
    return "warning" as const;
  if (status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

export function formatDocumentAction(action: string) {
  return (
    (
      {
        document_generated: "PDF contractuel généré",
        document_imported: "PDF importé",
        fields_prepared: "Zones de signature préparées",
        sent_for_signature: "Document envoyé aux parties",
        document_signed: "Signature applicative enregistrée",
        document_finalized: "PDF final généré et scellé",
        document_archived: "Document archivé",
        document_cancelled: "Document annulé",
      } as Record<string, string>
    )[action] ?? action.replaceAll("_", " ")
  );
}
