import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { getContract, type ContractItem } from "../../api/contracts";
import {
  generateContractDocument,
  getContractDocument,
  importContractDocument,
  type DocumentItem,
} from "../../api/documents";
import { useAuth } from "../../auth/useAuth";
import { PageContainer } from "../../components/layout/PageContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { getErrorMessage } from "../../shared/utils/errors";
import { DocumentWorkspace } from "./components/DocumentWorkspace";

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

export function ContractDocumentPage() {
  const { contractId = "" } = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractItem | null>(null);
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextContract, nextDocument] = await Promise.all([
        getContract(contractId),
        getContractDocument(contractId),
      ]);
      setContract(nextContract);
      setDocument(nextDocument);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [contractId]);
  useEffect(() => {
    void load();
  }, [load]);

  const canPrepare = Boolean(
    contract &&
    contract.requesterId === user?.id &&
    ["sent", "active"].includes(contract.status),
  );

  async function generate() {
    setPending("generate");
    setError(null);
    try {
      setDocument(await generateContractDocument(contractId));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  async function importPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("pdf");
    const title = String(form.get("title") ?? "").trim();
    if (!(file instanceof File) || file.size === 0) {
      setError("Sélectionnez un fichier PDF.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Le fichier doit être un PDF.");
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setError("Le PDF ne doit pas dépasser 15 Mo.");
      return;
    }
    setPending("import");
    setError(null);
    try {
      setDocument(await importContractDocument(contractId, file, title));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  return (
    <PageContainer className="grid gap-5">
      <Link
        className="w-fit text-sm font-bold text-emerald-800 underline underline-offset-4"
        to={
          contract?.serviceId ? `/services/${contract.serviceId}` : "/documents"
        }
      >
        ← Retour au service
      </Link>
      {loading ? (
        <LoadingState message="Chargement du contrat et de son document…" />
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
      {document ? (
        <DocumentWorkspace document={document} onChange={setDocument} />
      ) : null}
      {!loading && !document && contract && canPrepare ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="grid content-start gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Option recommandée
              </p>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-950">
                Générer le contrat PDF
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Le PDF reprend le service, les parties, le montant et prépare
                une zone de signature obligatoire pour chacun.
              </p>
            </div>
            <Button
              disabled={pending !== null}
              onClick={() => void generate()}
              variant="primary"
            >
              {pending === "generate"
                ? "Génération…"
                : "Générer le PDF contractuel"}
            </Button>
          </Card>
          <Card>
            <h2 className="text-lg font-extrabold text-slate-950">
              Importer votre propre PDF
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              PDF uniquement, 15 Mo maximum. Le contenu sera contrôlé avant
              préparation.
            </p>
            <form className="mt-5 grid gap-4" onSubmit={importPdf}>
              <label className="grid gap-2 text-sm font-bold text-slate-900">
                Titre
                <Input
                  defaultValue={`Contrat - ${contract.service?.title ?? "service"}`}
                  name="title"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-900">
                Fichier PDF
                <Input
                  accept="application/pdf"
                  name="pdf"
                  required
                  type="file"
                />
              </label>
              <Button disabled={pending !== null} type="submit">
                {pending === "import"
                  ? "Import en cours…"
                  : "Importer et vérifier"}
              </Button>
            </form>
          </Card>
        </div>
      ) : null}
      {!loading && !document && contract && !canPrepare ? (
        <EmptyState
          icon="contract"
          message="Le demandeur doit générer et préparer le PDF avant votre signature."
          title="Document en préparation"
        />
      ) : null}
    </PageContainer>
  );
}
