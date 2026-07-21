import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDocument, type DocumentItem } from "../../api/documents";
import { PageContainer } from "../../components/layout/PageContainer";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import { getErrorMessage } from "../../shared/utils/errors";
import { DocumentWorkspace } from "./components/DocumentWorkspace";

export function DocumentDetailPage() {
  const { documentId = "" } = useParams();
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDocument(await getDocument(documentId));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [documentId]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContainer className="grid gap-5">
      <Link
        className="w-fit text-sm font-bold text-emerald-800 underline underline-offset-4"
        to="/documents"
      >
        ← Mes documents
      </Link>
      {loading ? <LoadingState message="Chargement du document…" /> : null}
      {error ? <ErrorMessage message={error} /> : null}
      {document ? (
        <DocumentWorkspace document={document} onChange={setDocument} />
      ) : null}
    </PageContainer>
  );
}
