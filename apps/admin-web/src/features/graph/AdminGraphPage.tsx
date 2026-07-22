import { useCallback, useEffect, useState } from "react";

import {
  checkGraph,
  fetchGraphJobs,
  fetchGraphStats,
  fetchGraphStatus,
  processGraphJobs,
  reconcileGraph,
  retryGraphJobs,
  type GraphStats,
  type GraphStatus,
  type GraphSyncJobPage,
} from "../../api/graph";
import { ApiError } from "../../api/client";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";

const stateLabels = {
  healthy: "Disponible",
  degraded: "Dégradé",
  unavailable: "Indisponible",
  disabled: "Désactivé",
} as const;

const jobLabels = {
  pending: "En attente",
  processing: "En cours",
  completed: "Terminé",
  failed: "Échec",
} as const;

const entityLabels = {
  user: "Utilisateur",
  neighborhood: "Quartier",
  service: "Service",
  event: "Événement",
  review: "Avis",
} as const;

const operationLabels = {
  upsert: "Mettre à jour",
  delete: "Retirer",
  rebuild_relations: "Reconstruire les relations",
} as const;

export function AdminGraphPage() {
  const [status, setStatus] = useState<GraphStatus | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [jobs, setJobs] = useState<GraphSyncJobPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutation, setMutation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<
    "all" | "user" | "neighborhood" | "service" | "event" | "review"
  >("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextStatus, nextJobs] = await Promise.all([
        fetchGraphStatus(),
        fetchGraphJobs(),
      ]);
      setStatus(nextStatus);
      setJobs(nextJobs);
      if (nextStatus.health.state === "healthy") {
        setStats(await fetchGraphStats());
      } else {
        setStats(null);
      }
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(
    label: string,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setMutation(label);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await load();
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setMutation(null);
    }
  }

  async function confirmReconciliation() {
    if (
      !window.confirm(
        "Reconstruire les projections à partir de MongoDB ? Cette opération peut prendre plusieurs minutes.",
      )
    )
      return;
    await run(
      "reconcile",
      () =>
        reconcileGraph(false, entityType === "all" ? undefined : entityType),
      "Réconciliation terminée.",
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          <button
            className="min-h-11 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            disabled={Boolean(mutation)}
            onClick={() =>
              void run("check", checkGraph, "Connectivité vérifiée.")
            }
            type="button"
          >
            {mutation === "check" ? "Vérification…" : "Vérifier la connexion"}
          </button>
        }
        description="Supervision du graphe de recommandations. Les données MongoDB restent prioritaires et le fallback demeure actif en cas d’indisponibilité."
        eyebrow="Infrastructure optionnelle"
        title="Graphe et recommandations"
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500">
            Chargement de l’état du graphe…
          </p>
        </Card>
      ) : null}
      {!loading && status ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="État"
              value={stateLabels[status.health.state]}
              tone={
                status.health.state === "healthy"
                  ? "success"
                  : status.health.state === "disabled"
                    ? "neutral"
                    : "warning"
              }
            />
            <Metric
              label="Mode courant"
              value={
                status.mode === "graph"
                  ? "Graphe"
                  : status.mode === "disabled"
                    ? "Désactivé"
                    : "Fallback MongoDB"
              }
              tone={status.mode === "graph" ? "success" : "neutral"}
            />
            <Metric
              label="Jobs en attente"
              value={String(status.jobs.pending ?? 0)}
              tone={(status.jobs.pending ?? 0) > 0 ? "warning" : "neutral"}
            />
            <Metric
              label="Jobs en échec"
              value={String(status.jobs.failed ?? 0)}
              tone={(status.jobs.failed ?? 0) > 0 ? "danger" : "neutral"}
            />
          </section>

          <p className="text-sm text-slate-500">
            Dernière vérification : {formatDate(status.health.lastCheckedAt)}
            {status.health.serverVersion
              ? ` · Neo4j ${status.health.serverVersion}`
              : ""}
          </p>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Synchronisation
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Les projections sont rejouables et n’altèrent jamais la source
                  MongoDB.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  Type à réconcilier
                  <select
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    disabled={Boolean(mutation)}
                    onChange={(event) =>
                      setEntityType(event.target.value as typeof entityType)
                    }
                    value={entityType}
                  >
                    <option value="all">Tous les types</option>
                    <option value="user">Utilisateurs</option>
                    <option value="neighborhood">Quartiers</option>
                    <option value="service">Services</option>
                    <option value="event">Événements</option>
                    <option value="review">Avis</option>
                  </select>
                </label>
                <button
                  className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={
                    Boolean(mutation) || status.health.state === "disabled"
                  }
                  onClick={() =>
                    void run("batch", processGraphJobs, "Lot de jobs traité.")
                  }
                  type="button"
                >
                  Traiter un lot
                </button>
                <button
                  className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={Boolean(mutation)}
                  onClick={() =>
                    void run(
                      "retry",
                      retryGraphJobs,
                      "Les jobs en échec ont été reprogrammés.",
                    )
                  }
                  type="button"
                >
                  Rejouer les échecs
                </button>
                <button
                  className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={Boolean(mutation)}
                  onClick={() =>
                    void run(
                      "dry-run",
                      () =>
                        reconcileGraph(
                          true,
                          entityType === "all" ? undefined : entityType,
                        ),
                      "Estimation de réconciliation terminée.",
                    )
                  }
                  type="button"
                >
                  Estimer
                </button>
                <button
                  className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={
                    Boolean(mutation) || status.health.state !== "healthy"
                  }
                  onClick={() => void confirmReconciliation()}
                  type="button"
                >
                  Synchronisation complète
                </button>
              </div>
            </div>
            {status.latestReconciliation ? (
              <p className="mt-4 text-sm text-slate-500">
                Dernière réconciliation :{" "}
                {formatDate(status.latestReconciliation.completedAt)} ·{" "}
                {status.latestReconciliation.errors.length} erreur(s)
              </p>
            ) : null}
          </Card>

          {stats?.available ? (
            <Card>
              <h2 className="text-lg font-extrabold text-slate-950">
                Projection actuelle
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(stats.nodes).map(([label, count]) => (
                  <div className="rounded-lg bg-slate-50 p-4" key={label}>
                    <span className="text-xs font-bold uppercase text-slate-400">
                      {label}
                    </span>
                    <strong className="mt-1 block text-2xl text-slate-950">
                      {count}
                    </strong>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-extrabold text-slate-950">
                Derniers jobs
              </h2>
            </div>
            {jobs?.items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Opération</th>
                      <th className="px-5 py-3">État</th>
                      <th className="px-5 py-3">Tentatives</th>
                      <th className="px-5 py-3">Dernière mise à jour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.items.map((job) => (
                      <tr key={job._id}>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {entityLabels[job.entityType]}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {operationLabels[job.operation]}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            tone={
                              job.status === "completed"
                                ? "success"
                                : job.status === "failed"
                                  ? "danger"
                                  : job.status === "pending"
                                    ? "warning"
                                    : "neutral"
                            }
                          >
                            {jobLabels[job.status]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {job.attempts}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(job.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <EmptyState message="Aucun job de projection n’est enregistré." />
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Badge tone={tone}>{value}</Badge>
      </div>
    </Card>
  );
}

function readError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Impossible de charger la supervision du graphe.";
}

function formatDate(value?: string | null) {
  if (!value) return "Jamais";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date inconnue"
    : date.toLocaleString("fr-FR");
}
