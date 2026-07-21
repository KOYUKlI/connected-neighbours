import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "../../api/client";
import {
  archiveAdminDocument,
  cancelAdminDocument,
  fetchAdminDocument,
  fetchAdminDocumentDownload,
  fetchAdminDocuments,
  type AdminDocument,
  type AdminDocumentStatus,
} from "../../api/documents";
import {
  AdminActionMenu,
  AdminBadge,
  AdminListHeader,
  AdminListTable,
  AdminListTabs,
  AdminListToolbar,
  AdminResetButton,
  AdminSearchInput,
  AdminSelect,
  matchesSearch,
  paginateRows,
  sortAdminRows,
  type AdminSortState,
} from "../../components/ui/AdminList";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { LoadingState } from "../../components/ui/LoadingState";

const statusLabels: Record<AdminDocumentStatus, string> = {
  draft: "Brouillon",
  uploaded: "Importé",
  prepared: "Préparé",
  sent_for_signature: "À signer",
  partially_signed: "Partiellement signé",
  signed: "Signé",
  finalized: "Finalisé",
  archived: "Archivé",
  cancelled: "Annulé",
};
type DocumentTab = "all" | "pending" | "finalized" | "archived";

export function DocumentsPage() {
  const [items, setItems] = useState<AdminDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      setItems((await fetchAdminDocuments()).items);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  if (selectedId)
    return (
      <DocumentDetail
        documentId={selectedId}
        onBack={() => setSelectedId(null)}
        onChanged={() => void load()}
      />
    );
  if (loading) return <LoadingState message="Chargement des documents…" />;
  return (
    <DocumentsList
      error={error}
      items={items}
      onRefresh={() => void load()}
      onSelect={setSelectedId}
    />
  );
}

function DocumentsList({
  error,
  items,
  onRefresh,
  onSelect,
}: {
  error: string | null;
  items: AdminDocument[];
  onRefresh: () => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<DocumentTab>("all");
  const [status, setStatus] = useState<"all" | AdminDocumentStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selection, setSelection] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminSortState | null>({
    key: "createdAt",
    direction: "desc",
  });
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesTab =
          tab === "all" ||
          (tab === "pending" &&
            ["prepared", "sent_for_signature", "partially_signed"].includes(
              item.status,
            )) ||
          (tab === "finalized" && item.status === "finalized") ||
          (tab === "archived" && item.status === "archived");
        return (
          matchesTab &&
          (status === "all" || item.status === status) &&
          matchesSearch(
            query,
            item.title,
            item.service?.title,
            item.contract?.requester?.displayName,
            item.contract?.provider?.displayName,
          )
        );
      }),
    [items, query, status, tab],
  );
  const sorted = useMemo(
    () =>
      sortAdminRows(filtered, sort, {
        createdAt: (item) => Date.parse(item.createdAt ?? ""),
        service: (item) => item.service?.title,
        status: (item) => statusLabels[item.status],
        progress: (item) => item.progress.signed,
      }),
    [filtered, sort],
  );
  const rows = paginateRows(sorted, page, pageSize);
  function resetSelection() {
    setPage(1);
    setSelection([]);
  }
  function reset() {
    setTab("all");
    setStatus("all");
    setQuery("");
    resetSelection();
  }
  return (
    <section className="grid gap-4">
      <AdminListHeader
        action={<Button onClick={onRefresh}>Actualiser</Button>}
        description="Contrôlez les PDF contractuels, leur progression, leurs empreintes et leur archivage."
        title="Documents"
      />
      {error ? <ErrorMessage message={error} /> : null}
      <AdminListTabs
        items={[
          { id: "all", label: "Tous", count: items.length },
          {
            id: "pending",
            label: "En attente",
            count: items.filter((item) =>
              ["prepared", "sent_for_signature", "partially_signed"].includes(
                item.status,
              ),
            ).length,
          },
          {
            id: "finalized",
            label: "Finalisés",
            count: items.filter((item) => item.status === "finalized").length,
          },
          {
            id: "archived",
            label: "Archivés",
            count: items.filter((item) => item.status === "archived").length,
          },
        ]}
        onChange={(value) => {
          setTab(value);
          resetSelection();
        }}
        value={tab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={(value) => {
            setQuery(value);
            resetSelection();
          }}
          placeholder="Rechercher un service ou une partie"
          value={query}
        />
        <AdminSelect
          label="Statut"
          onChange={(value) => {
            setStatus(value as typeof status);
            resetSelection();
          }}
          value={status}
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AdminSelect>
        <AdminResetButton onClick={reset} />
      </AdminListToolbar>
      <AdminListTable
        columns={[
          {
            header: "Document",
            render: (item) => (
              <div className="min-w-0">
                <strong className="block truncate text-slate-950">
                  {item.service?.title ?? item.title}
                </strong>
                <span className="block truncate text-xs text-slate-500">
                  {item.type === "contract" ? "Contrat généré" : "PDF importé"}
                </span>
              </div>
            ),
            sortKey: "service",
            width: "25%",
          },
          {
            header: "Parties",
            render: (item) => (
              <div className="min-w-0">
                <span className="block truncate">
                  {item.contract?.requester?.displayName ?? "Demandeur inconnu"}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {item.contract?.provider?.displayName ??
                    "Prestataire inconnu"}
                </span>
              </div>
            ),
            width: "22%",
          },
          {
            header: "Statut",
            render: (item) => (
              <AdminBadge tone={tone(item.status)}>
                {statusLabels[item.status]}
              </AdminBadge>
            ),
            sortKey: "status",
            width: "15%",
          },
          {
            header: "Progression",
            render: (item) => `${item.progress.signed}/${item.progress.total}`,
            sortKey: "progress",
            width: "11%",
          },
          {
            className: "whitespace-nowrap",
            header: "Création",
            render: (item) => formatDate(item.createdAt),
            sortKey: "createdAt",
            width: "16%",
          },
          {
            header: "Actions",
            render: (item) => (
              <AdminActionMenu
                items={[
                  { label: "Consulter", onClick: () => onSelect(item.id) },
                ]}
              />
            ),
            width: "11%",
          },
        ]}
        emptyDescription="Les contrats générés et les PDF importés apparaîtront ici."
        emptyMessage="Aucun document trouvé"
        getRowKey={(item) => item.id}
        minWidth="900px"
        onPageChange={(value) => {
          setPage(value);
          setSelection([]);
        }}
        onPageSizeChange={(value) => {
          setPageSize(value);
          resetSelection();
        }}
        onRowClick={(item) => onSelect(item.id)}
        onSelectedRowKeysChange={setSelection}
        onSortChange={(value) => {
          setSort(value);
          resetSelection();
        }}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selection}
        sort={sort}
        summaryLabel={`${sorted.length} documents`}
        tableLabel="Tous"
        total={sorted.length}
      />
    </section>
  );
}

function DocumentDetail({
  documentId,
  onBack,
  onChanged,
}: {
  documentId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [document, setDocument] = useState<AdminDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAdminDocument(documentId);
      setDocument(next);
      const variant = next.files.final ? "final" : "current";
      setPreviewUrl(
        (await fetchAdminDocumentDownload(documentId, variant)).url,
      );
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [documentId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function mutate(label: string, action: () => Promise<AdminDocument>) {
    setPending(label);
    setError(null);
    try {
      setDocument(await action());
      onChanged();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }
  async function download(variant: "original" | "current" | "final") {
    setPending(variant);
    try {
      window.location.assign(
        (await fetchAdminDocumentDownload(documentId, variant, "attachment"))
          .url,
      );
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }
  if (loading)
    return <LoadingState message="Chargement du dossier documentaire…" />;
  if (!document)
    return <ErrorMessage message={error ?? "Document introuvable."} />;
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button onClick={onBack}>← Retour</Button>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-950">
            {document.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {document.service?.title} · version {document.version}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {document.permissions.canDownloadOriginal ? (
            <Button
              disabled={pending === "original"}
              onClick={() => void download("original")}
            >
              Original
            </Button>
          ) : null}
          {document.permissions.canDownloadCurrent ? (
            <Button
              disabled={pending === "current"}
              onClick={() => void download("current")}
            >
              Révision
            </Button>
          ) : null}
          {document.permissions.canDownloadFinal ? (
            <Button
              disabled={pending === "final"}
              onClick={() => void download("final")}
              variant="primary"
            >
              Final
            </Button>
          ) : null}
          {document.permissions.canArchive ? (
            <Button
              disabled={pending === "archive"}
              onClick={() =>
                void mutate("archive", () => archiveAdminDocument(document.id))
              }
              variant="secondary"
            >
              Archiver
            </Button>
          ) : null}
          {document.permissions.canCancel ? (
            <Button
              disabled={pending === "cancel"}
              onClick={() =>
                void mutate("cancel", () => cancelAdminDocument(document.id))
              }
              variant="danger"
            >
              Annuler
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Card className="min-h-[42rem] p-2">
          {previewUrl ? (
            <object
              aria-label={`Aperçu de ${document.title}`}
              className="h-full min-h-[40rem] w-full rounded-lg"
              data={previewUrl}
              type="application/pdf"
            >
              <a href={previewUrl}>Ouvrir le PDF</a>
            </object>
          ) : (
            <p className="p-5 text-sm text-slate-500">Aperçu indisponible.</p>
          )}
        </Card>
        <div className="grid content-start gap-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-extrabold text-slate-950">Métadonnées</h2>
              <AdminBadge tone={tone(document.status)}>
                {statusLabels[document.status]}
              </AdminBadge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <Row
                label="Contrat"
                value={document.service?.title ?? document.title}
              />
              <Row
                label="Demandeur"
                value={document.contract?.requester?.displayName ?? "—"}
              />
              <Row
                label="Prestataire"
                value={document.contract?.provider?.displayName ?? "—"}
              />
              <Row
                label="Signatures"
                value={`${document.progress.signed}/${document.progress.total}`}
              />
              <Row
                label="Finalisation"
                value={formatDate(document.finalizedAt)}
              />
            </dl>
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-950">
              Empreintes SHA-256
            </h2>
            <Hash label="Original" value={document.hashes.original} />
            <Hash label="Révision" value={document.hashes.current} />
            {document.hashes.final ? (
              <Hash label="Final" value={document.hashes.final} />
            ) : null}
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-950">
              Signataires et champs
            </h2>
            <div className="mt-4 grid gap-3">
              {document.signers.map((signer) => (
                <div
                  className="rounded-lg bg-slate-50 p-3 text-sm"
                  key={signer.userId}
                >
                  <strong>
                    {signer.profile?.displayName ?? "Partie au contrat"}
                  </strong>
                  <span className="ml-2 text-slate-500">
                    {signer.status === "signed"
                      ? `signé le ${formatDate(signer.signedAt)}`
                      : "en attente"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {document.fields.length} zone
              {document.fields.length > 1 ? "s" : ""} sur {document.pageCount}{" "}
              page{document.pageCount > 1 ? "s" : ""}.
            </p>
          </Card>
        </div>
      </div>
      <Card>
        <h2 className="font-extrabold text-slate-950">Audit documentaire</h2>
        <ol className="mt-4 grid gap-3">
          {document.auditTrail.map((entry, index) => (
            <li
              className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0"
              key={`${entry.action}-${entry.at}-${index}`}
            >
              <span className="font-medium text-slate-800">
                {entry.action.replaceAll("_", " ")}
              </span>
              <time className="whitespace-nowrap text-slate-500">
                {formatDate(entry.at)}
              </time>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-950">{value}</dd>
    </div>
  );
}
function Hash({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-lg bg-slate-950 p-3">
      <span className="text-xs font-bold text-white">{label}</span>
      <code className="mt-1 block break-all text-[11px] text-slate-300">
        {value}
      </code>
    </div>
  );
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}
function tone(status: AdminDocumentStatus) {
  if (["finalized", "archived"].includes(status)) return "emerald" as const;
  if (["prepared", "sent_for_signature", "partially_signed"].includes(status))
    return "amber" as const;
  if (status === "cancelled") return "red" as const;
  return "slate" as const;
}
function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Impossible de charger les documents.";
}
