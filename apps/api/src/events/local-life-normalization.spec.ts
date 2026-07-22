import { EventResponseStatus } from './schemas/event-response.schema';
import { EventStatus } from './schemas/event.schema';
import {
  effectiveEventStatus,
  normalizeEventRecord,
  normalizeEventResponseRecord,
} from './event-normalization';
import {
  effectiveVoteStatus,
  normalizeVoteRecord,
} from '../votes/vote-normalization';
import { VoteBallotType, VoteStatus } from '../votes/schemas/vote.schema';

describe('local life legacy normalization', () => {
  const now = new Date('2026-07-22T10:00:00.000Z');

  it('normalizes a scheduled event and supplies a two-hour legacy end', () => {
    const event = normalizeEventRecord(
      {
        _id: 'event-1',
        startsAt: '2026-07-23T10:00:00.000Z',
        status: EventStatus.SCHEDULED,
      },
      now,
    );

    expect(event.status).toBe(EventStatus.OPEN_REGISTRATION);
    expect(event.legacyStatus).toBe(EventStatus.SCHEDULED);
    expect(event.endsAt.toISOString()).toBe('2026-07-23T12:00:00.000Z');
  });

  it('keeps a terminal event status even when dates overlap', () => {
    expect(
      effectiveEventStatus(
        EventStatus.CANCELLED,
        new Date('2026-07-21T09:00:00.000Z'),
        new Date('2026-07-21T11:00:00.000Z'),
        now,
      ),
    ).toBe(EventStatus.CANCELLED);
  });

  it('computes started and completed effective event states without a write', () => {
    expect(
      effectiveEventStatus(
        EventStatus.OPEN_REGISTRATION,
        new Date('2026-07-22T09:00:00.000Z'),
        new Date('2026-07-22T11:00:00.000Z'),
        now,
      ),
    ).toBe(EventStatus.STARTED);
    expect(
      effectiveEventStatus(
        EventStatus.OPEN_REGISTRATION,
        new Date('2026-07-22T07:00:00.000Z'),
        new Date('2026-07-22T09:00:00.000Z'),
        now,
      ),
    ).toBe(EventStatus.COMPLETED);
  });

  it('maps legacy event interest to a canonical response without exposing userId', () => {
    const normalized = normalizeEventResponseRecord({
      _id: 'response-1',
      eventId: 'event-1',
      interest: EventResponseStatus.MAYBE,
      respondedAt: now,
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        id: 'response-1',
        eventId: 'event-1',
        response: EventResponseStatus.MAYBE,
      }),
    );
    expect(normalized).not.toHaveProperty('interest');
    expect(normalized).not.toHaveProperty('userId');
  });

  it('maps legacy vote fields to the canonical title and ballot type', () => {
    const vote = normalizeVoteRecord(
      {
        _id: 'vote-1',
        question: 'Question historique',
        allowMultipleChoices: true,
        opensAt: '2026-07-23T09:00:00.000Z',
        closesAt: '2026-07-24T09:00:00.000Z',
        status: VoteStatus.SCHEDULED,
        options: [{ label: 'A' }, { label: 'B' }],
      },
      now,
    );

    expect(vote.title).toBe('Question historique');
    expect(vote.ballotType).toBe(VoteBallotType.MULTIPLE_CHOICE);
    expect(vote).not.toHaveProperty('question');
    expect(vote).not.toHaveProperty('allowMultipleChoices');
  });

  it('computes vote opening and closing from server time', () => {
    expect(
      effectiveVoteStatus(
        VoteStatus.SCHEDULED,
        new Date('2026-07-22T09:00:00.000Z'),
        new Date('2026-07-22T11:00:00.000Z'),
        now,
      ),
    ).toBe(VoteStatus.OPEN);
    expect(
      effectiveVoteStatus(
        VoteStatus.OPEN,
        new Date('2026-07-22T11:00:00.000Z'),
        new Date('2026-07-22T12:00:00.000Z'),
        now,
      ),
    ).toBe(VoteStatus.SCHEDULED);
    expect(
      effectiveVoteStatus(
        VoteStatus.OPEN,
        new Date('2026-07-22T08:00:00.000Z'),
        new Date('2026-07-22T09:00:00.000Z'),
        now,
      ),
    ).toBe(VoteStatus.CLOSED);
  });
});
