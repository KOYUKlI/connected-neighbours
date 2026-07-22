import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import { GraphProjectionService } from './graph-projection.service';
import { GraphSyncService } from './graph-sync.service';
import { GraphHealthState } from './graph.types';
import { Neo4jService } from './neo4j.service';

@Injectable()
export class GraphSyncWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(GraphSyncWorker.name);
  private readonly workerId = randomUUID();
  private readonly enabled: boolean;
  private readonly intervalMs: number;
  private readonly batchSize: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly neo4jService: Neo4jService,
    private readonly graphSyncService: GraphSyncService,
    private readonly projectionService: GraphProjectionService,
  ) {
    this.enabled = this.readBoolean('GRAPH_SYNC_WORKER_ENABLED', true);
    this.intervalMs = this.readNumber(
      'GRAPH_SYNC_INTERVAL_MS',
      15000,
      1000,
      300000,
    );
    this.batchSize = this.readNumber('GRAPH_SYNC_BATCH_SIZE', 20, 1, 100);
  }

  onApplicationBootstrap() {
    if (!this.enabled || !this.neo4jService.isConfigured) return;
    void this.bootstrap();
    this.timer = setInterval(() => void this.processBatch(), this.intervalMs);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async processBatch(limit = this.batchSize) {
    if (this.running || !this.neo4jService.canAttempt) return { processed: 0 };
    this.running = true;
    let processed = 0;
    try {
      for (let index = 0; index < Math.min(limit, 100); index += 1) {
        const job = await this.graphSyncService.acquireNext(this.workerId);
        if (!job) break;
        try {
          await this.projectionService.project(
            job.entityType,
            job.entityId,
            job.operation,
          );
          await this.graphSyncService.complete(job);
          processed += 1;
        } catch (error) {
          await this.graphSyncService.fail(job, error);
          if (!this.neo4jService.canAttempt) break;
        }
      }
      return { processed };
    } finally {
      this.running = false;
    }
  }

  private async bootstrap() {
    const health = await this.neo4jService.checkConnectivity(true);
    if (health.state !== GraphHealthState.HEALTHY) return;
    try {
      await this.neo4jService.ensureConstraints();
      await this.processBatch();
    } catch {
      this.logger.warn(
        'Initialisation Neo4j différée; le fallback reste actif.',
      );
    }
  }

  private readBoolean(key: string, fallback: boolean) {
    const value = this.configService.get<boolean | string>(key);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return fallback;
  }

  private readNumber(key: string, fallback: number, min: number, max: number) {
    const value = Number(this.configService.get<number | string>(key));
    return Number.isFinite(value)
      ? Math.min(max, Math.max(min, value))
      : fallback;
  }
}
