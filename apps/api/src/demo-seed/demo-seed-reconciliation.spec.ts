import {
  buildDemoSeedReconciliationPlan,
  getDemoContractPartyIds,
  selectSeedServiceCandidate,
} from './demo-seed-reconciliation';

describe('demo seed reconciliation', () => {
  it('adopte un ancien service seed après rotation des identifiants utilisateur', () => {
    const result = selectSeedServiceCandidate({
      expectedOwnerId: 'new-alice',
      currentUserIds: new Set(['new-alice']),
      candidates: [{ id: 'service-1', ownerId: 'old-alice', seedOwned: true }],
    });

    expect(result).toEqual({
      kind: 'adopt',
      candidate: {
        id: 'service-1',
        ownerId: 'old-alice',
        seedOwned: true,
      },
    });
  });

  it('supprime uniquement la branche seed orpheline dans l’ordre des références', () => {
    const plan = buildPlan({ ownedApplication: true });

    expect(plan.blocked).toHaveLength(0);
    expect(plan.actions.map((action) => action.entityType)).toEqual([
      'document',
      'point-transaction',
      'contract',
      'application',
      'service',
    ]);
    expect(
      plan.actions.every((action) => action.rootServiceId === 'old-service'),
    ).toBe(true);
  });

  it('conserve une branche contenant une donnée métier non seed', () => {
    const plan = buildPlan({ ownedApplication: false });

    expect(plan.actions).toHaveLength(0);
    expect(plan.blocked).toEqual([
      expect.objectContaining({
        entityType: 'application',
        entityId: 'manual-application',
      }),
    ]);
  });

  it('ne considère jamais un service manuel comme preuve d’un doublon seed', () => {
    const plan = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['new-alice']),
        services: [
          {
            entityType: 'service',
            id: 'old-service',
            title: 'Titre partagé',
            ownerId: 'old-alice',
          },
          {
            entityType: 'service',
            id: 'manual-service',
            title: 'Titre partagé',
            ownerId: 'new-alice',
          },
        ],
        nodes: [],
        records: [{ id: 'r1', entityType: 'service', entityId: 'old-service' }],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(plan.actions).toHaveLength(0);
  });

  it('retire les réponses seed liées aux anciens acteurs sans toucher aux réponses manuelles', () => {
    const plan = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['new-alice']),
        services: [],
        nodes: [
          {
            entityType: 'event-response',
            id: 'seed-response',
            actorId: 'old-alice',
          },
          {
            entityType: 'vote-answer',
            id: 'manual-answer',
            actorId: 'old-alice',
          },
        ],
        records: [
          {
            id: 'r1',
            entityType: 'event-response',
            entityId: 'seed-response',
          },
        ],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(plan.actions).toEqual([
      expect.objectContaining({
        entityType: 'event-response',
        entityId: 'seed-response',
      }),
    ]);
  });

  it('nettoie un marqueur de service restant après interruption', () => {
    const plan = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['new-alice']),
        services: [],
        nodes: [],
        records: [
          {
            id: 'record-old-service',
            entityType: 'service',
            entityId: 'old-service',
          },
        ],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(plan.actions).toEqual([
      expect.objectContaining({
        kind: 'delete-registry-record',
        recordId: 'record-old-service',
      }),
    ]);
  });

  it('reprend avec les seules actions restantes après une interruption', () => {
    const resumed = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['new-alice']),
        services: [
          {
            entityType: 'service',
            id: 'old-service',
            title: 'Même scénario',
            ownerId: 'old-alice',
            scenarioFingerprint: 'same-fingerprint',
          },
          {
            entityType: 'service',
            id: 'current-service',
            title: 'Même scénario',
            ownerId: 'new-alice',
            scenarioFingerprint: 'same-fingerprint',
          },
        ],
        nodes: [],
        records: [
          { id: 'r1', entityType: 'service', entityId: 'old-service' },
          { id: 'r2', entityType: 'service', entityId: 'current-service' },
        ],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(resumed.actions).toEqual([
      expect.objectContaining({
        kind: 'delete',
        entityType: 'service',
        entityId: 'old-service',
      }),
    ]);
  });

  it('conserve le doublon seed le plus récent après une seconde rotation utilisateur', () => {
    const plan = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['third-alice']),
        services: [
          {
            entityType: 'service',
            id: '000000000000000000000001',
            title: 'Même scénario',
            ownerId: 'first-alice',
            scenarioFingerprint: 'same-fingerprint',
          },
          {
            entityType: 'service',
            id: '000000000000000000000002',
            title: 'Même scénario',
            ownerId: 'second-alice',
            scenarioFingerprint: 'same-fingerprint',
          },
        ],
        nodes: [],
        records: [
          {
            id: 'r1',
            entityType: 'service',
            entityId: '000000000000000000000001',
          },
          {
            id: 'r2',
            entityType: 'service',
            entityId: '000000000000000000000002',
          },
        ],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(plan.actions).toEqual([
      expect.objectContaining({
        entityType: 'service',
        entityId: '000000000000000000000001',
      }),
    ]);
  });

  it('recrée un contrat seed dont les parties ont tourné après ses dépendances', () => {
    const plan = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['new-requester', 'new-provider']),
        services: [],
        nodes: [
          {
            entityType: 'contract',
            id: 'old-contract',
            serviceId: 'service-1',
            actorIds: ['old-requester', 'old-provider'],
          },
          {
            entityType: 'document',
            id: 'old-document',
            contractId: 'old-contract',
          },
        ],
        records: [
          { id: 'r1', entityType: 'contract', entityId: 'old-contract' },
          { id: 'r2', entityType: 'document', entityId: 'old-document' },
        ],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(plan.blocked).toHaveLength(0);
    expect(plan.actions.map((action) => action.entityType)).toEqual([
      'document',
      'contract',
    ]);
  });

  it('bloque la réconciliation d’un contrat si une dépendance est manuelle', () => {
    const plan = buildDemoSeedReconciliationPlan(
      {
        currentUserIds: new Set(['new-requester']),
        services: [],
        nodes: [
          {
            entityType: 'contract',
            id: 'old-contract',
            serviceId: 'service-1',
            actorIds: ['old-requester'],
          },
          {
            entityType: 'document',
            id: 'manual-document',
            contractId: 'old-contract',
          },
        ],
        records: [
          { id: 'r1', entityType: 'contract', entityId: 'old-contract' },
        ],
      },
      '2026-07-23T00:00:00.000Z',
    );

    expect(plan.actions).toHaveLength(0);
    expect(plan.blocked).toEqual([
      expect.objectContaining({
        entityType: 'document',
        entityId: 'manual-document',
      }),
    ]);
  });

  it('produit exactement le même plan sur deux exécutions successives', () => {
    const first = buildPlan({ ownedApplication: true });
    const second = buildPlan({ ownedApplication: true });

    expect(second).toEqual(first);
  });

  it('utilise les véritables parties du contrat, même sans Alice ni Bob', () => {
    expect(
      getDemoContractPartyIds({
        requesterId: 'sarah-id',
        providerId: 'lina-id',
      }),
    ).toEqual({ requesterId: 'sarah-id', providerId: 'lina-id' });
  });
});

function buildPlan({ ownedApplication }: { ownedApplication: boolean }) {
  const records = [
    { id: 'r1', entityType: 'service', entityId: 'old-service' },
    { id: 'r2', entityType: 'service', entityId: 'current-service' },
    { id: 'r3', entityType: 'contract', entityId: 'old-contract' },
    { id: 'r4', entityType: 'document', entityId: 'old-document' },
    { id: 'r5', entityType: 'point-transaction', entityId: 'old-points' },
  ];
  if (ownedApplication) {
    records.push({
      id: 'r6',
      entityType: 'application',
      entityId: 'manual-application',
    });
  }
  return buildDemoSeedReconciliationPlan(
    {
      currentUserIds: new Set(['new-alice']),
      services: [
        {
          entityType: 'service',
          id: 'old-service',
          title: 'Même scénario',
          ownerId: 'old-alice',
          scenarioFingerprint: 'same-fingerprint',
        },
        {
          entityType: 'service',
          id: 'current-service',
          title: 'Même scénario',
          ownerId: 'new-alice',
          scenarioFingerprint: 'same-fingerprint',
        },
      ],
      nodes: [
        {
          entityType: 'application',
          id: 'manual-application',
          serviceId: 'old-service',
        },
        {
          entityType: 'contract',
          id: 'old-contract',
          serviceId: 'old-service',
        },
        {
          entityType: 'document',
          id: 'old-document',
          contractId: 'old-contract',
        },
        {
          entityType: 'point-transaction',
          id: 'old-points',
          contractId: 'old-contract',
        },
      ],
      records,
    },
    '2026-07-23T00:00:00.000Z',
  );
}
