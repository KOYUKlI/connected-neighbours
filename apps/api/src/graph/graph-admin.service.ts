import { BadRequestException, Injectable } from '@nestjs/common';

import { GraphHealthService } from './graph-health.service';
import { GraphReconciliationService } from './graph-reconciliation.service';
import { GraphSyncService } from './graph-sync.service';
import { GraphSyncWorker } from './graph-sync.worker';
import { GraphHealthState } from './graph.types';
import { Neo4jService } from './neo4j.service';
import { ReconcileGraphDto } from './dto/reconcile-graph.dto';

@Injectable()
export class GraphAdminService {
  constructor(
    private readonly healthService: GraphHealthService,
    private readonly neo4jService: Neo4jService,
    private readonly syncService: GraphSyncService,
    private readonly syncWorker: GraphSyncWorker,
    private readonly reconciliationService: GraphReconciliationService,
  ) {}

  async status() {
    return {
      health: this.healthService.status(),
      jobs: await this.syncService.counts(),
      latestReconciliation: this.reconciliationService.latest,
      mode:
        this.healthService.status().state === GraphHealthState.HEALTHY
          ? 'graph'
          : this.healthService.status().state === GraphHealthState.DISABLED
            ? 'disabled'
            : 'fallback',
    };
  }

  async stats() {
    if (!this.neo4jService.canAttempt) {
      return { available: false, nodes: {}, relationships: {} };
    }
    const [nodesResult, relationshipsResult] = await Promise.all([
      this.neo4jService.executeRead(
        `CALL {
           MATCH (node:User) RETURN 'User' AS type, count(node) AS count
           UNION ALL MATCH (node:Neighborhood) RETURN 'Neighborhood' AS type, count(node) AS count
           UNION ALL MATCH (node:Service) RETURN 'Service' AS type, count(node) AS count
           UNION ALL MATCH (node:Event) RETURN 'Event' AS type, count(node) AS count
         }
         RETURN type, count`,
      ),
      this.neo4jService.executeRead(
        `MATCH ()-[relationship]->()
         RETURN type(relationship) AS type, count(relationship) AS count
         ORDER BY type ASC`,
      ),
    ]);
    return {
      available: true,
      nodes: this.countMap(nodesResult.records),
      relationships: this.countMap(relationshipsResult.records),
    };
  }

  check() {
    return this.healthService.check();
  }

  async synchronize() {
    await this.neo4jService.ensureConstraints();
    return this.syncWorker.processBatch(100);
  }

  retryFailed() {
    return this.syncService.retryFailed();
  }

  reconcile(dto: ReconcileGraphDto) {
    if (!dto.dryRun && !dto.confirm) {
      throw new BadRequestException(
        'Une confirmation explicite est requise pour synchroniser le graphe.',
      );
    }
    return this.reconciliationService.reconcile(dto.entityTypes, dto.dryRun);
  }

  private countMap(records: Array<{ get: (key: string) => unknown }>) {
    return Object.fromEntries(
      records.map((record) => [
        String(record.get('type')),
        this.toNumber(record.get('count')),
      ]),
    );
  }

  private toNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value ?? 0);
  }
}
