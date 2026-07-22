import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { EventsService } from './events.service';
import { EventCategory, EventStatus } from './schemas/event.schema';

describe('EventsService business guards', () => {
  let rules: {
    assertCanCreate(dto: Record<string, unknown>, actor: Actor): void;
    assertCanRespond(event: EventLike, actor: Actor): void;
    validateDates(
      start: Date,
      end?: Date,
      deadline?: Date,
      publishing?: boolean,
    ): unknown;
  };

  beforeEach(() => {
    const service = new EventsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    rules = service as unknown as typeof rules;
  });

  it('allows a resident to create a draft in their neighborhood', () => {
    expect(() =>
      rules.assertCanCreate(
        { neighborhoodId: 'centre', category: EventCategory.SPORT },
        actor('alice'),
      ),
    ).not.toThrow();
  });

  it('rejects creation in another neighborhood', () => {
    expect(() =>
      rules.assertCanCreate(
        { neighborhoodId: 'nord', category: EventCategory.SPORT },
        actor('alice'),
      ),
    ).toThrow(ForbiddenException);
  });

  it('reserves emergency events to moderation', () => {
    expect(() =>
      rules.assertCanCreate(
        { neighborhoodId: 'centre', category: EventCategory.EMERGENCY },
        actor('alice'),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects a non-draft status at creation', () => {
    expect(() =>
      rules.assertCanCreate(
        {
          neighborhoodId: 'centre',
          category: EventCategory.SPORT,
          status: EventStatus.PUBLISHED,
        },
        actor('admin', Role.ADMIN),
      ),
    ).toThrow(BadRequestException);
  });

  it('validates end and registration deadline ordering', () => {
    const start = future(4);
    expect(() => rules.validateDates(start, future(3))).toThrow(
      BadRequestException,
    );
    expect(() => rules.validateDates(start, future(5), future(5))).toThrow(
      BadRequestException,
    );
  });

  it('rejects publication of an event already ended', () => {
    expect(() =>
      rules.validateDates(
        new Date(Date.now() - 7_200_000),
        new Date(Date.now() - 3_600_000),
        undefined,
        true,
      ),
    ).toThrow(ConflictException);
  });

  it('rejects an organizer response to their own event', () => {
    expect(() =>
      rules.assertCanRespond(event({ organizerId: 'alice' }), actor('alice')),
    ).toThrow(ForbiddenException);
  });

  it('hides an event from a resident in another neighborhood', () => {
    expect(() =>
      rules.assertCanRespond(event({ neighborhoodId: 'nord' }), actor('alice')),
    ).toThrow(NotFoundException);
  });

  it('rejects responses to cancelled events and after the deadline', () => {
    expect(() =>
      rules.assertCanRespond(
        event({ status: EventStatus.CANCELLED }),
        actor('alice'),
      ),
    ).toThrow(ConflictException);
    expect(() =>
      rules.assertCanRespond(
        event({ registrationDeadline: new Date(Date.now() - 1_000) }),
        actor('alice'),
      ),
    ).toThrow(ConflictException);
  });

  it('accepts a response while registration is open', () => {
    expect(() => rules.assertCanRespond(event(), actor('alice'))).not.toThrow();
  });
});

type Actor = { sub: string; role: Role; neighborhoodId: string };
type EventLike = {
  organizerId: string;
  neighborhoodId: string;
  status: EventStatus;
  startsAt: Date;
  registrationDeadline: Date | null;
};

function actor(sub: string, role = Role.RESIDENT): Actor {
  return { sub, role, neighborhoodId: 'centre' };
}

function event(overrides: Partial<EventLike> = {}): EventLike {
  return {
    organizerId: 'bob',
    neighborhoodId: 'centre',
    status: EventStatus.OPEN_REGISTRATION,
    startsAt: future(4),
    registrationDeadline: future(3),
    ...overrides,
  };
}

function future(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
