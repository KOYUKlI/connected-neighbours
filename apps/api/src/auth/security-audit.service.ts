import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  SecurityAuditEvent,
  SecurityAuditEventDocument,
  SecurityEventResult,
  SecurityEventType,
} from './schemas/security-audit-event.schema';

const FORBIDDEN_CONTEXT_KEYS =
  /password|token|secret|cookie|authorization|code|sessionid/i;

@Injectable()
export class SecurityAuditService {
  constructor(
    @InjectModel(SecurityAuditEvent.name)
    private readonly eventModel: Model<SecurityAuditEventDocument>,
  ) {}

  async record(input: {
    userId?: string | null;
    provider: 'local' | 'keycloak' | 'system';
    eventType: SecurityEventType;
    result: SecurityEventResult;
    context?: Record<string, unknown>;
  }) {
    await this.eventModel.create({
      userId: input.userId ?? null,
      provider: input.provider,
      eventType: input.eventType,
      result: input.result,
      occurredAt: new Date(),
      context: this.sanitizeContext(input.context ?? {}),
    });
  }

  async listForUser(userId: string, limit = 100) {
    return this.eventModel
      .find({ userId })
      .sort({ occurredAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .select('-_id eventType provider result occurredAt context')
      .lean()
      .exec();
  }

  private sanitizeContext(context: Record<string, unknown>) {
    const sanitized: Record<string, string | number | boolean | null> = {};

    for (const [key, value] of Object.entries(context)) {
      if (FORBIDDEN_CONTEXT_KEYS.test(key)) continue;

      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        sanitized[key] =
          typeof value === 'string' ? value.slice(0, 200) : value;
      }
    }

    return sanitized;
  }
}
