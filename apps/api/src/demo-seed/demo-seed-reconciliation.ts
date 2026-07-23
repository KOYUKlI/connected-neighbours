export type DemoSeedEntityType =
  | 'application'
  | 'contract'
  | 'dispute'
  | 'dispute-evidence'
  | 'document'
  | 'event-response'
  | 'graph-sync-job'
  | 'point-transaction'
  | 'review'
  | 'security-audit'
  | 'service'
  | 'service-proof'
  | 'storage-file'
  | 'vote-answer';

export type DemoSeedSnapshotNode = {
  entityType: DemoSeedEntityType;
  id: string;
  serviceId?: string | null;
  contractId?: string | null;
  disputeId?: string | null;
  contextId?: string | null;
  linkedEntityId?: string | null;
  actorId?: string | null;
  actorIds?: string[];
};

export type DemoSeedServiceSnapshot = DemoSeedSnapshotNode & {
  entityType: 'service';
  title: string;
  ownerId: string;
  scenarioFingerprint?: string;
};

export type DemoSeedRecordSnapshot = {
  id: string;
  entityType: string;
  entityId: string;
};

export type DemoSeedReconciliationAction = {
  kind: 'delete' | 'delete-registry-record';
  entityType: DemoSeedEntityType | 'seed-record';
  entityId: string;
  recordId?: string;
  rootServiceId?: string;
  reason: string;
};

export type DemoSeedReconciliationBlock = {
  rootServiceId: string;
  entityType: DemoSeedEntityType;
  entityId: string;
  reason: string;
};

export type DemoSeedReconciliationPlan = {
  generatedAt: string;
  actions: DemoSeedReconciliationAction[];
  blocked: DemoSeedReconciliationBlock[];
  summary: Record<string, number>;
};

export type DemoSeedReconciliationSnapshot = {
  currentUserIds: ReadonlySet<string>;
  services: DemoSeedServiceSnapshot[];
  nodes: DemoSeedSnapshotNode[];
  records: DemoSeedRecordSnapshot[];
};

const DELETE_ORDER: readonly DemoSeedEntityType[] = [
  'storage-file',
  'dispute-evidence',
  'document',
  'event-response',
  'vote-answer',
  'security-audit',
  'review',
  'service-proof',
  'point-transaction',
  'dispute',
  'contract',
  'application',
  'graph-sync-job',
  'service',
];

export function buildDemoSeedReconciliationPlan(
  snapshot: DemoSeedReconciliationSnapshot,
  generatedAt = new Date().toISOString(),
): DemoSeedReconciliationPlan {
  const owned = new Set(
    snapshot.records.map((record) => `${record.entityType}:${record.entityId}`),
  );
  const existing = new Set(
    [...snapshot.services, ...snapshot.nodes].map(
      (node) => `${node.entityType}:${node.id}`,
    ),
  );
  const serviceGroups = new Map<string, DemoSeedServiceSnapshot[]>();
  for (const service of snapshot.services) {
    if (!service.scenarioFingerprint || !owned.has(`service:${service.id}`)) {
      continue;
    }
    const key = `${service.title}\u0000${service.scenarioFingerprint}`;
    const group = serviceGroups.get(key) ?? [];
    group.push(service);
    serviceGroups.set(key, group);
  }
  const staleRoots = [...serviceGroups.values()].flatMap((group) => {
    if (group.length < 2) return [];
    const current = group.filter((service) =>
      snapshot.currentUserIds.has(service.ownerId),
    );
    const canonical = [...(current.length > 0 ? current : group)].sort((a, b) =>
      b.id.localeCompare(a.id),
    )[0];
    return group.filter((service) => service.id !== canonical.id);
  });
  const actions: DemoSeedReconciliationAction[] = [];
  const blocked: DemoSeedReconciliationBlock[] = [];

  for (const root of staleRoots.sort((a, b) => a.id.localeCompare(b.id))) {
    const branch = collectServiceBranch(root, snapshot.nodes);
    const unowned = branch.filter(
      (node) =>
        node.entityType !== 'graph-sync-job' &&
        !owned.has(`${node.entityType}:${node.id}`),
    );
    if (unowned.length > 0) {
      blocked.push(
        ...unowned.map((node) => ({
          rootServiceId: root.id,
          entityType: node.entityType,
          entityId: node.id,
          reason:
            'Dépendance non enregistrée dans demo_seed_records; suppression refusée.',
        })),
      );
      continue;
    }
    actions.push(
      ...branch.map((node) => ({
        kind: 'delete' as const,
        entityType: node.entityType,
        entityId: node.id,
        rootServiceId: root.id,
        reason:
          node.entityType === 'service'
            ? `Ancien service seed doublonné après rotation du propriétaire: ${root.title}.`
            : `Dépendance du service seed orphelin ${root.id}.`,
      })),
    );
  }

  const staleContracts = snapshot.nodes.filter(
    (node) =>
      node.entityType === 'contract' &&
      node.actorIds?.some((actorId) => !snapshot.currentUserIds.has(actorId)) &&
      owned.has(`contract:${node.id}`),
  );
  for (const contract of staleContracts) {
    const branch = collectContractBranch(contract, snapshot.nodes);
    const unowned = branch.filter(
      (node) => !owned.has(`${node.entityType}:${node.id}`),
    );
    if (unowned.length > 0) {
      blocked.push(
        ...unowned.map((node) => ({
          rootServiceId: contract.serviceId ?? '',
          entityType: node.entityType,
          entityId: node.id,
          reason:
            'Dépendance de contrat non enregistrée dans demo_seed_records; suppression refusée.',
        })),
      );
      continue;
    }
    actions.push(
      ...branch.map((node) => ({
        kind: 'delete' as const,
        entityType: node.entityType,
        entityId: node.id,
        rootServiceId: contract.serviceId ?? undefined,
        reason:
          node.entityType === 'contract'
            ? 'Contrat seed lié à d’anciens identifiants de parties.'
            : `Dépendance du contrat seed obsolète ${contract.id}.`,
      })),
    );
  }

  for (const node of snapshot.nodes) {
    if (
      (node.actorId || node.actorIds?.length) &&
      [
        'application',
        'dispute-evidence',
        'event-response',
        'review',
        'security-audit',
        'service-proof',
        'vote-answer',
      ].includes(node.entityType) &&
      [node.actorId, ...(node.actorIds ?? [])].some(
        (actorId) => actorId && !snapshot.currentUserIds.has(actorId),
      ) &&
      owned.has(`${node.entityType}:${node.id}`)
    ) {
      actions.push({
        kind: 'delete',
        entityType: node.entityType,
        entityId: node.id,
        reason:
          'Enregistrement seed lié à un ancien identifiant utilisateur après rotation.',
      });
    }
  }

  for (const record of snapshot.records) {
    if (
      record.entityType === 'service' &&
      !existing.has(`${record.entityType}:${record.entityId}`)
    ) {
      actions.push({
        kind: 'delete-registry-record',
        entityType: 'seed-record',
        entityId: record.entityId,
        recordId: record.id,
        reason:
          'Marqueur de provenance sans document associé après une interruption.',
      });
    }
  }

  const deduplicated = new Map<string, DemoSeedReconciliationAction>();
  for (const action of actions) {
    deduplicated.set(
      `${action.kind}:${action.entityType}:${action.entityId}`,
      action,
    );
  }
  const sortedActions = [...deduplicated.values()].sort((a, b) => {
    const aOrder =
      a.entityType === 'seed-record'
        ? DELETE_ORDER.length + 1
        : DELETE_ORDER.indexOf(a.entityType);
    const bOrder =
      b.entityType === 'seed-record'
        ? DELETE_ORDER.length + 1
        : DELETE_ORDER.indexOf(b.entityType);
    return aOrder - bOrder || a.entityId.localeCompare(b.entityId);
  });
  const summary = sortedActions.reduce<Record<string, number>>(
    (result, action) => {
      result[action.entityType] = (result[action.entityType] ?? 0) + 1;
      return result;
    },
    {},
  );
  return { generatedAt, actions: sortedActions, blocked, summary };
}

function collectContractBranch(
  contract: DemoSeedSnapshotNode,
  nodes: DemoSeedSnapshotNode[],
) {
  const branch = new Map<string, DemoSeedSnapshotNode>();
  branch.set(`contract:${contract.id}`, contract);
  let changed = true;
  while (changed) {
    changed = false;
    const contractIds = ids(branch, 'contract');
    const disputeIds = ids(branch, 'dispute');
    const linkedIds = new Set([
      ...ids(branch, 'dispute-evidence'),
      ...ids(branch, 'document'),
    ]);
    for (const node of nodes) {
      const key = `${node.entityType}:${node.id}`;
      if (branch.has(key)) continue;
      const belongs =
        (node.contractId != null && contractIds.has(node.contractId)) ||
        (node.disputeId != null && disputeIds.has(node.disputeId)) ||
        (node.linkedEntityId != null && linkedIds.has(node.linkedEntityId)) ||
        (node.contextId != null &&
          (contractIds.has(node.contextId) || linkedIds.has(node.contextId)));
      if (belongs) {
        branch.set(key, node);
        changed = true;
      }
    }
  }
  return [...branch.values()];
}

export function selectSeedServiceCandidate(input: {
  expectedOwnerId: string;
  currentUserIds: ReadonlySet<string>;
  candidates: Array<{ id: string; ownerId: string; seedOwned: boolean }>;
}) {
  const exact = input.candidates.find(
    (candidate) => candidate.ownerId === input.expectedOwnerId,
  );
  if (exact) return { kind: 'existing' as const, candidate: exact };
  const adoptable = input.candidates.filter(
    (candidate) =>
      candidate.seedOwned && !input.currentUserIds.has(candidate.ownerId),
  );
  if (adoptable.length === 1) {
    return { kind: 'adopt' as const, candidate: adoptable[0] };
  }
  if (adoptable.length > 1) return { kind: 'conflict' as const };
  return { kind: 'create' as const };
}

export function getDemoContractPartyIds(contract: {
  requesterId: string;
  providerId: string;
}) {
  return {
    requesterId: contract.requesterId,
    providerId: contract.providerId,
  };
}

function collectServiceBranch(
  root: DemoSeedServiceSnapshot,
  nodes: DemoSeedSnapshotNode[],
) {
  const branch = new Map<string, DemoSeedSnapshotNode>();
  branch.set(`service:${root.id}`, root);
  let changed = true;
  while (changed) {
    changed = false;
    const serviceIds = ids(branch, 'service');
    const contractIds = ids(branch, 'contract');
    const disputeIds = ids(branch, 'dispute');
    const linkedIds = new Set([
      ...ids(branch, 'service-proof'),
      ...ids(branch, 'dispute-evidence'),
      ...ids(branch, 'document'),
    ]);
    for (const node of nodes) {
      const key = `${node.entityType}:${node.id}`;
      if (branch.has(key)) continue;
      const belongs =
        (node.serviceId != null && serviceIds.has(node.serviceId)) ||
        (node.contractId != null && contractIds.has(node.contractId)) ||
        (node.disputeId != null && disputeIds.has(node.disputeId)) ||
        (node.linkedEntityId != null && linkedIds.has(node.linkedEntityId)) ||
        (node.contextId != null &&
          (serviceIds.has(node.contextId) ||
            contractIds.has(node.contextId) ||
            linkedIds.has(node.contextId))) ||
        (node.entityType === 'graph-sync-job' && serviceIds.has(node.id));
      if (belongs) {
        branch.set(key, node);
        changed = true;
      }
    }
  }
  return [...branch.values()];
}

function ids(
  branch: ReadonlyMap<string, DemoSeedSnapshotNode>,
  entityType: DemoSeedEntityType,
) {
  return new Set(
    [...branch.values()]
      .filter((node) => node.entityType === entityType)
      .map((node) => node.id),
  );
}
