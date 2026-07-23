import { apiRequest } from "./client";

export type GraphHealthState =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "disabled";
export type GraphStatus = {
  health: {
    state: GraphHealthState;
    configured: boolean;
    lastCheckedAt: string | null;
    lastHealthyAt: string | null;
    nextRetryAt: string | null;
    errorCode: string | null;
    serverVersion: string | null;
  };
  jobs: Partial<
    Record<"pending" | "processing" | "completed" | "failed", number>
  >;
  latestReconciliation: GraphReconciliation | null;
  mode: "graph" | "fallback" | "disabled";
};

export type GraphStats = {
  available: boolean;
  nodes: Record<string, number>;
  relationships: Record<string, number>;
};

export type GraphSyncJob = {
  _id: string;
  entityType: "user" | "neighborhood" | "service" | "event" | "review";
  entityId: string;
  operation: "upsert" | "delete" | "rebuild_relations";
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  lastErrorCode: string | null;
  nextAttemptAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GraphSyncJobPage = {
  items: GraphSyncJob[];
  page: number;
  limit: number;
  total: number;
};

export type GraphReconciliation = {
  runId: string;
  dryRun: boolean;
  startedAt: string;
  completedAt: string;
  projected: Record<string, number>;
  removed: Record<string, number>;
  errors: Array<{ entityType: string; entityId: string; code: string }>;
};

export function fetchGraphStatus() {
  return apiRequest<GraphStatus>("/api/admin/graph/status");
}

export function fetchGraphStats() {
  return apiRequest<GraphStats>("/api/admin/graph/stats");
}

export function fetchGraphJobs() {
  return apiRequest<GraphSyncJobPage>("/api/admin/graph/sync-jobs?limit=25");
}

export function checkGraph() {
  return apiRequest<GraphStatus["health"]>("/api/admin/graph/check", {
    method: "POST",
  });
}

export function processGraphJobs() {
  return apiRequest<{ processed: number; failed: number }>(
    "/api/admin/graph/sync",
    { method: "POST" },
  );
}

export function retryGraphJobs() {
  return apiRequest<{ matchedCount?: number; modifiedCount?: number }>(
    "/api/admin/graph/retry-failed",
    { method: "POST" },
  );
}

export function reconcileGraph(
  dryRun: boolean,
  entityType?: GraphSyncJob["entityType"],
) {
  return apiRequest<GraphReconciliation>("/api/admin/graph/reconcile", {
    method: "POST",
    body: JSON.stringify({
      dryRun,
      confirm: !dryRun,
      ...(entityType ? { entityTypes: [entityType] } : {}),
    }),
  });
}
