import { Types } from 'mongoose';

import { EventResponseStatus } from './schemas/event-response.schema';
import { EventStatus } from './schemas/event.schema';

type EventLike = {
  _id?: unknown;
  id?: unknown;
  startsAt?: Date | string;
  endsAt?: Date | string | null;
  status?: EventStatus;
};

export type NormalizedEvent<T extends EventLike> = Omit<
  T,
  'id' | 'startsAt' | 'endsAt' | 'status'
> & {
  id: string | null;
  startsAt: Date;
  endsAt: Date;
  status: EventStatus;
  legacyStatus: EventStatus.SCHEDULED | null;
  effectiveStatus: EventStatus;
};

type EventResponseLike = {
  _id?: unknown;
  id?: unknown;
  eventId?: string;
  response?: EventResponseStatus;
  interest?: EventResponseStatus;
  respondedAt?: Date | string;
  waitlistPosition?: number | null;
  promotedAt?: Date | string | null;
  revision?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type NormalizedEventResponse = {
  id: string | null;
  eventId: string | null;
  response: EventResponseStatus;
  respondedAt: Date | string | null;
  waitlistPosition: number | null;
  promotedAt: Date | string | null;
  revision: number;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export function normalizeEventRecord<T extends EventLike>(
  event: T,
  now = new Date(),
): NormalizedEvent<T> {
  const startsAt = toDate(event.startsAt) ?? now;
  const endsAt =
    toDate(event.endsAt) ?? new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  const storedStatus = event.status ?? EventStatus.DRAFT;
  const canonicalStatus =
    storedStatus === EventStatus.SCHEDULED
      ? EventStatus.OPEN_REGISTRATION
      : storedStatus;

  return {
    ...event,
    id: resolveId(event),
    startsAt,
    endsAt,
    status: canonicalStatus,
    legacyStatus:
      storedStatus === EventStatus.SCHEDULED ? EventStatus.SCHEDULED : null,
    effectiveStatus: effectiveEventStatus(
      canonicalStatus,
      startsAt,
      endsAt,
      now,
    ),
  };
}

export function normalizeEventResponseRecord(
  response: EventResponseLike,
): NormalizedEventResponse {
  return {
    id: resolveId(response),
    eventId: response.eventId ?? null,
    response:
      response.response ??
      response.interest ??
      EventResponseStatus.NOT_INTERESTED,
    respondedAt: response.respondedAt ?? null,
    waitlistPosition: response.waitlistPosition ?? null,
    promotedAt: response.promotedAt ?? null,
    revision: response.revision ?? 0,
    createdAt: response.createdAt ?? null,
    updatedAt: response.updatedAt ?? null,
  };
}

export function effectiveEventStatus(
  status: EventStatus,
  startsAt: Date,
  endsAt: Date,
  now = new Date(),
) {
  if ([EventStatus.CANCELLED, EventStatus.ARCHIVED].includes(status))
    return status;
  if (status === EventStatus.COMPLETED || endsAt.getTime() <= now.getTime()) {
    return EventStatus.COMPLETED;
  }
  if (status === EventStatus.STARTED || startsAt.getTime() <= now.getTime()) {
    return EventStatus.STARTED;
  }
  return status;
}

function resolveId(input: { _id?: unknown; id?: unknown }) {
  if (typeof input.id === 'string') return input.id;
  if (typeof input._id === 'string') return input._id;
  return input._id instanceof Types.ObjectId ? input._id.toHexString() : null;
}

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
