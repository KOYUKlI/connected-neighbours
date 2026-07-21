import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getDocuments,
  type DocumentItem,
  type DocumentRoleFilter,
} from "../../api/documents";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";
import { Tabs } from "../../components/ui/Tabs";
import { PageContainer } from "../../components/layout/PageContainer";
import { formatDate } from "../../utils/format";
import { getErrorMessage } from "../../shared/utils/errors";
import { documentStatusLabels, getDocumentTone } from "./documentPresentation";

type DocumentsTab = "all" | DocumentRoleFilter;

export function DocumentsPage() {
  const [tab, setTab] = useState<DocumentsTab>("all");
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDocuments(tab === "all" ? {} : { role: tab });
      setItems(response.items);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);
  const counts = useMemo(
    () => ({
      toSign: items.filter((item) => item.permissions.canSign).length,
      completed: items.filter((item) =>
        ["finalized", "archived"].includes(item.status),
      ).length,
    }),
    [items],
  );

  return (
    <PageContainer className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Mes activités
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
            Mes documents
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Préparez, signez et retrouvez les PDF contractuels liés à vos
            services.
          </p>
        </div>
        <Button onClick={() => void load()} variant="ghost">
          Actualiser
        </Button>
      </header>

      <Tabs<DocumentsTab>
        items={[
          { id: "all", label: "Tous" },
          {
            id: "to-sign",
            label: "À signer",
            count: counts.toSign || undefined,
          },
          { id: "owned", label: "À préparer" },
          {
            id: "completed",
            label: "Finalisés",
            count: counts.completed || undefined,
          },
        ]}
        label="Filtres des documents"
        onChange={setTab}
        value={tab}
      />

      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState message="Chargement de vos documents…" /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState
          icon="contract"
          message="Les documents apparaissent après la génération d’un contrat payant."
          title="Aucun document dans cette vue"
        />
      ) : null}
      {!loading && items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Card as="article" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {item.service?.category ?? "Contrat de service"}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-extrabold text-slate-950">
                    {item.service?.title ?? item.title}
                  </h2>
                </div>
                <Badge tone={getDocumentTone(item.status)}>
                  {documentStatusLabels[item.status]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
                <div>
                  <span className="block text-xs text-slate-500">
                    Signatures
                  </span>
                  <strong className="mt-1 block text-slate-950">
                    {item.progress.signed}/{item.progress.total}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Création</span>
                  <strong className="mt-1 block text-slate-950">
                    {formatDate(item.createdAt)}
                  </strong>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Version {item.version}
                </span>
                <Link
                  className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                  to={`/documents/${item.id}`}
                >
                  {item.permissions.canSign
                    ? "Signer le document"
                    : "Consulter"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </PageContainer>
  );
}
