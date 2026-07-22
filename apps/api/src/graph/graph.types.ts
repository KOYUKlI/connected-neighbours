export enum GraphHealthState {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable',
  DISABLED = 'disabled',
}

export enum GraphEntityType {
  USER = 'user',
  NEIGHBORHOOD = 'neighborhood',
  SERVICE = 'service',
  EVENT = 'event',
  REVIEW = 'review',
}

export enum GraphSyncOperation {
  UPSERT = 'upsert',
  DELETE = 'delete',
  REBUILD_RELATIONS = 'rebuild_relations',
}

export type GraphHealthSnapshot = {
  state: GraphHealthState;
  configured: boolean;
  lastCheckedAt: Date | null;
  lastHealthyAt: Date | null;
  nextRetryAt: Date | null;
  errorCode: string | null;
  serverVersion: string | null;
};

export type GraphRecommendationCandidate = {
  id: string;
  score: number;
  reasons: string[];
};

export type GraphReconciliationReport = {
  runId: string;
  dryRun: boolean;
  startedAt: Date;
  completedAt: Date;
  projected: Partial<Record<GraphEntityType, number>>;
  removed: Partial<Record<GraphEntityType, number>>;
  errors: Array<{
    entityType: GraphEntityType;
    entityId: string;
    code: string;
  }>;
};
