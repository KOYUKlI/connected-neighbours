import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { normalizeGraphError } from './graph.errors';
import { GraphEntityType, GraphSyncOperation } from './graph.types';
import {
  GraphSyncJob,
  GraphSyncJobDocument,
  GraphSyncJobStatus,
} from './schemas/graph-sync-job.schema';

const MAX_ATTEMPTS = 6;
const LOCK_DURATION_MS = 45_000;

@Injectable()
export class GraphSyncService {
  private readonly logger = new Logger(GraphSyncService.name);

  constructor(
    @InjectModel(GraphSyncJob.name)
    private readonly jobModel: Model<GraphSyncJobDocument>,
  ) {}

  async enqueue(
    entityType: GraphEntityType,
    entityId: string,
    operation = GraphSyncOperation.UPSERT,
  ) {
    try {
      await this.enqueueStrict(entityType, entityId, operation);
      return true;
    } catch (error) {
      this.logger.warn(
        `Projection ${entityType}/${entityId} non planifiée (${normalizeGraphError(error)}).`,
      );
      return false;
    }
  }

  async enqueueStrict(
    entityType: GraphEntityType,
    entityId: string,
    operation = GraphSyncOperation.UPSERT,
  ) {
    const activeKey = this.activeKey(entityType, entityId);
    const existing = await this.jobModel
      .findOne({ activeKey })
      .select('_id status')
      .lean<{ _id: unknown; status: GraphSyncJobStatus } | null>()
      .exec();
    if (existing) {
      if (existing.status === GraphSyncJobStatus.PROCESSING) {
        await this.jobModel
          .findByIdAndUpdate(String(existing._id), {
            $set: { rerunRequested: true, operation },
          })
          .exec();
      } else {
        await this.jobModel
          .findByIdAndUpdate(String(existing._id), {
            $set: { operation, nextAttemptAt: new Date() },
          })
          .exec();
      }
      return String(existing._id);
    }
    const created = await this.jobModel.create({
      entityType,
      entityId,
      operation,
      status: GraphSyncJobStatus.PENDING,
      attempts: 0,
      lastErrorCode: null,
      nextAttemptAt: new Date(),
      lockedUntil: null,
      workerId: null,
      rerunRequested: false,
      activeKey,
      completedAt: null,
    });
    return created.id;
  }

  async acquireNext(workerId: string) {
    const now = new Date();
    return this.jobModel
      .findOneAndUpdate(
        {
          attempts: { $lt: MAX_ATTEMPTS },
          nextAttemptAt: { $lte: now },
          $or: [
            { status: GraphSyncJobStatus.PENDING },
            {
              status: GraphSyncJobStatus.PROCESSING,
              lockedUntil: { $lte: now },
            },
          ],
        },
        {
          $set: {
            status: GraphSyncJobStatus.PROCESSING,
            lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
            workerId,
            lastErrorCode: null,
          },
          $inc: { attempts: 1 },
        },
        { new: true, sort: { nextAttemptAt: 1, createdAt: 1 } },
      )
      .exec();
  }

  async complete(job: GraphSyncJobDocument) {
    const fresh = await this.jobModel
      .findById(job.id)
      .select('rerunRequested')
      .lean<{ rerunRequested: boolean } | null>()
      .exec();
    if (fresh?.rerunRequested) {
      await this.jobModel
        .updateOne(
          { _id: job.id, workerId: job.workerId },
          {
            $set: {
              status: GraphSyncJobStatus.PENDING,
              nextAttemptAt: new Date(),
              lockedUntil: null,
              workerId: null,
              rerunRequested: false,
            },
          },
        )
        .exec();
      return;
    }
    await this.jobModel
      .updateOne(
        { _id: job.id, workerId: job.workerId },
        {
          $set: {
            status: GraphSyncJobStatus.COMPLETED,
            completedAt: new Date(),
            lockedUntil: null,
            workerId: null,
            activeKey: null,
          },
        },
      )
      .exec();
  }

  async fail(job: GraphSyncJobDocument, error: unknown) {
    const terminal = job.attempts >= MAX_ATTEMPTS;
    const delay = Math.min(
      5 * 60_000,
      2 ** Math.max(0, job.attempts - 1) * 5000,
    );
    await this.jobModel
      .updateOne(
        { _id: job.id, workerId: job.workerId },
        {
          $set: {
            status: terminal
              ? GraphSyncJobStatus.FAILED
              : GraphSyncJobStatus.PENDING,
            lastErrorCode: normalizeGraphError(error),
            nextAttemptAt: new Date(Date.now() + delay),
            lockedUntil: null,
            workerId: null,
            activeKey: terminal ? null : job.activeKey,
          },
        },
      )
      .exec();
  }

  async retryFailed() {
    const jobs = await this.jobModel
      .find({ status: GraphSyncJobStatus.FAILED })
      .limit(100)
      .exec();
    let retried = 0;
    for (const job of jobs) {
      const activeKey = this.activeKey(job.entityType, job.entityId);
      const collision = await this.jobModel.exists({ activeKey });
      if (collision) continue;
      job.status = GraphSyncJobStatus.PENDING;
      job.attempts = 0;
      job.lastErrorCode = null;
      job.nextAttemptAt = new Date();
      job.activeKey = activeKey;
      job.completedAt = null;
      await job.save();
      retried += 1;
    }
    return { retried };
  }

  async counts() {
    const rows = await this.jobModel
      .aggregate<{
        _id: GraphSyncJobStatus;
        count: number;
      }>([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .exec();
    return Object.fromEntries(rows.map((row) => [row._id, row.count]));
  }

  list(page = 1, limit = 25, status?: GraphSyncJobStatus) {
    const filter = status ? { status } : {};
    return Promise.all([
      this.jobModel
        .find(filter)
        .select('-activeKey -workerId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.jobModel.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, page, limit, total }));
  }

  private activeKey(entityType: GraphEntityType, entityId: string) {
    return `${entityType}:${entityId}`;
  }
}
