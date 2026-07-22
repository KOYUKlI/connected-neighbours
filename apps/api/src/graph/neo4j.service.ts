import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

import { GraphUnavailableError, normalizeGraphError } from './graph.errors';
import { GraphHealthSnapshot, GraphHealthState } from './graph.types';

type QueryParameters = Record<string, unknown>;
export type GraphQueryResult = {
  records: Array<{ get: (key: string | number) => unknown }>;
};

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private readonly database: string;
  private readonly timeoutMs: number;
  private readonly retryCooldownMs: number;
  private readonly driver: Driver | null;
  private consecutiveFailures = 0;
  private snapshot: GraphHealthSnapshot;

  constructor(private readonly configService: ConfigService) {
    const enabled = this.readBoolean('NEO4J_ENABLED', false);
    const uri = this.configService.get<string>('NEO4J_URI')?.trim();
    const username = this.configService.get<string>('NEO4J_USERNAME')?.trim();
    const password = this.configService.get<string>('NEO4J_PASSWORD')?.trim();
    this.database =
      this.configService.get<string>('NEO4J_DATABASE')?.trim() || 'neo4j';
    this.timeoutMs = this.readNumber('NEO4J_TIMEOUT_MS', 2500, 250, 10000);
    this.retryCooldownMs = this.readNumber(
      'NEO4J_RETRY_COOLDOWN_MS',
      15000,
      1000,
      300000,
    );
    const configured = Boolean(enabled && uri && username && password);
    this.snapshot = {
      state: configured ? GraphHealthState.DEGRADED : GraphHealthState.DISABLED,
      configured,
      lastCheckedAt: null,
      lastHealthyAt: null,
      nextRetryAt: null,
      errorCode: configured ? 'not_checked' : null,
      serverVersion: null,
    };
    this.driver = configured
      ? neo4j.driver(uri!, neo4j.auth.basic(username!, password!), {
          connectionTimeout: this.timeoutMs,
          connectionAcquisitionTimeout: this.timeoutMs,
          maxTransactionRetryTime: 0,
          maxConnectionPoolSize: 25,
          telemetryDisabled: true,
        })
      : null;
  }

  get health() {
    return { ...this.snapshot };
  }

  get isConfigured() {
    return this.snapshot.configured;
  }

  get canAttempt() {
    if (!this.driver || !this.snapshot.configured) return false;
    return (
      !this.snapshot.nextRetryAt ||
      this.snapshot.nextRetryAt.getTime() <= Date.now()
    );
  }

  async checkConnectivity(force = false) {
    if (!this.driver) return this.health;
    if (!force && !this.canAttempt) return this.health;
    try {
      await this.withTimeout(
        this.driver.verifyConnectivity({ database: this.database }),
      );
      const result = await this.run(
        'READ',
        'CALL dbms.components() YIELD versions RETURN versions[0] AS version LIMIT 1',
        {},
        true,
      );
      const version = result.records[0]?.get('version');
      this.markHealthy(typeof version === 'string' ? version : null);
    } catch (error) {
      this.markFailure(error);
    }
    return this.health;
  }

  executeRead(
    cypher: string,
    parameters: QueryParameters = {},
  ): Promise<GraphQueryResult> {
    return this.run('READ', cypher, parameters);
  }

  executeWrite(
    cypher: string,
    parameters: QueryParameters = {},
  ): Promise<GraphQueryResult> {
    return this.run('WRITE', cypher, parameters);
  }

  async ensureConstraints() {
    const statements = [
      'CREATE CONSTRAINT graph_user_mongo_id IF NOT EXISTS FOR (node:User) REQUIRE node.mongoId IS UNIQUE',
      'CREATE CONSTRAINT graph_neighborhood_mongo_id IF NOT EXISTS FOR (node:Neighborhood) REQUIRE node.mongoId IS UNIQUE',
      'CREATE CONSTRAINT graph_service_mongo_id IF NOT EXISTS FOR (node:Service) REQUIRE node.mongoId IS UNIQUE',
      'CREATE CONSTRAINT graph_event_mongo_id IF NOT EXISTS FOR (node:Event) REQUIRE node.mongoId IS UNIQUE',
      'CREATE INDEX graph_service_status IF NOT EXISTS FOR (node:Service) ON (node.status)',
      'CREATE INDEX graph_service_category IF NOT EXISTS FOR (node:Service) ON (node.category)',
      'CREATE INDEX graph_event_status IF NOT EXISTS FOR (node:Event) ON (node.status)',
      'CREATE INDEX graph_event_category IF NOT EXISTS FOR (node:Event) ON (node.category)',
      'CREATE INDEX graph_event_starts_at IF NOT EXISTS FOR (node:Event) ON (node.startsAt)',
    ];
    for (const statement of statements) await this.executeWrite(statement);
  }

  async onModuleDestroy() {
    if (this.driver) await this.driver.close();
  }

  private async run(
    mode: 'READ' | 'WRITE',
    cypher: string,
    parameters: QueryParameters,
    bypassCircuit = false,
  ): Promise<GraphQueryResult> {
    if (!this.driver || (!bypassCircuit && !this.canAttempt)) {
      throw new GraphUnavailableError(
        this.snapshot.state === GraphHealthState.DISABLED
          ? 'disabled'
          : 'circuit_open',
      );
    }
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode:
        mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE,
    });
    try {
      const result = await this.withTimeout(
        session.run(cypher, parameters, { timeout: this.timeoutMs }),
      );
      this.markHealthy();
      return result as GraphQueryResult;
    } catch (error) {
      this.markFailure(error);
      throw new GraphUnavailableError(normalizeGraphError(error));
    } finally {
      await session.close();
    }
  }

  private markHealthy(serverVersion?: string | null) {
    const now = new Date();
    this.consecutiveFailures = 0;
    this.snapshot = {
      ...this.snapshot,
      state: GraphHealthState.HEALTHY,
      lastCheckedAt: now,
      lastHealthyAt: now,
      nextRetryAt: null,
      errorCode: null,
      serverVersion: serverVersion ?? this.snapshot.serverVersion,
    };
  }

  private markFailure(error: unknown) {
    this.consecutiveFailures += 1;
    const now = new Date();
    const cooldown =
      this.retryCooldownMs * Math.min(this.consecutiveFailures, 4);
    this.snapshot = {
      ...this.snapshot,
      state:
        this.consecutiveFailures > 1
          ? GraphHealthState.UNAVAILABLE
          : GraphHealthState.DEGRADED,
      lastCheckedAt: now,
      nextRetryAt: new Date(now.getTime() + cooldown),
      errorCode: normalizeGraphError(error),
    };
    this.logger.warn(
      `Neo4j indisponible (${this.snapshot.errorCode}); fallback MongoDB actif.`,
    );
  }

  private async withTimeout<T>(promise: Promise<T>) {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Neo4j operation timeout')),
            this.timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private readBoolean(key: string, fallback: boolean) {
    const value = this.configService.get<boolean | string>(key);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return fallback;
  }

  private readNumber(
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ) {
    const value = Number(this.configService.get<number | string>(key));
    return Number.isFinite(value)
      ? Math.min(maximum, Math.max(minimum, value))
      : fallback;
  }
}
