import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { Role } from '../auth/role.enum';
import {
  VoteBallotType,
  VotePrivacy,
  VoteResultsVisibility,
  VoteStatus,
} from './schemas/vote.schema';
import { normalizeVoteRecord } from './vote-normalization';
import { VotesService } from './votes.service';

describe('VotesService', () => {
  let service: VotesService;

  const voteModelMock = {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const answerModelMock = {
    aggregate: jest.fn(),
    find: jest.fn(),
  };
  const neighborhoodModelMock = {
    find: jest.fn(),
  };
  const publicUsersServiceMock = {
    findByIds: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    answerModelMock.aggregate.mockReturnValue(execResult([]));
    answerModelMock.find.mockReturnValue(selectOrLeanExecResult([]));
    neighborhoodModelMock.find.mockReturnValue(selectLeanExecResult([]));
    publicUsersServiceMock.findByIds.mockResolvedValue(new Map());
    service = new VotesService(
      voteModelMock as never,
      answerModelMock as never,
      neighborhoodModelMock as never,
      publicUsersServiceMock as never,
    );
  });

  it('rejects closing a vote as its resident creator', async () => {
    await expect(service.close('vote_1', user('creator'))).rejects.toThrow(
      ForbiddenException,
    );
    expect(voteModelMock.findById).not.toHaveBeenCalled();
  });

  it.each([
    ['admin', Role.ADMIN],
    ['moderator', Role.MODERATOR],
  ])('allows %s to close a vote', async (sub, role) => {
    const vote = voteDocument();
    const closedVote = {
      ...vote,
      status: VoteStatus.CLOSED,
      closedAt: new Date(),
    };

    voteModelMock.findById.mockReturnValue(execResult(vote));
    voteModelMock.findOneAndUpdate.mockReturnValue(leanExecResult(closedVote));

    const result = await service.close('vote_1', user(sub, role));

    expect(result.id).toBe('vote_1');
    expect(result.status).toBe(VoteStatus.CLOSED);
    expect(result.answersCount).toBe(0);
    expect(result.results).not.toBeNull();
    expect(result.results?.totalAnswers).toBe(0);

    const calls = voteModelMock.findOneAndUpdate.mock.calls as unknown as Array<
      [
        { _id: string; status: VoteStatus },
        { $set: { status: VoteStatus } },
        { returnDocument: string },
      ]
    >;
    expect(calls[0]?.[0]).toEqual({
      _id: 'vote_1',
      status: VoteStatus.OPEN,
    });
    expect(calls[0]?.[1].$set.status).toBe(VoteStatus.CLOSED);
    expect(calls[0]?.[2]).toEqual({ returnDocument: 'after' });
  });

  it('rejects vote creation by a resident', async () => {
    await expect(
      service.create(
        {
          title: 'Vote interdit',
          neighborhoodId: 'quartier-centre',
          options: ['Oui', 'Non'],
          closesAt: new Date(Date.now() + 86_400_000),
        },
        user('resident'),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('validates yes/no and single-choice answers', () => {
    const validate = validator(service);
    expect(
      validate(normalizedVote(VoteBallotType.YES_NO), {
        selectedOptionIds: ['option-1'],
      }),
    ).toEqual({ selectedOptionIds: ['option-1'], ranking: [] });
    expect(() =>
      validate(normalizedVote(VoteBallotType.SINGLE_CHOICE), {
        selectedOptionIds: ['option-1', 'option-2'],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects duplicate and foreign options', () => {
    const validate = validator(service);
    expect(() =>
      validate(normalizedVote(VoteBallotType.MULTIPLE_CHOICE), {
        selectedOptionIds: ['option-1', 'option-1'],
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      validate(normalizedVote(VoteBallotType.SINGLE_CHOICE), {
        selectedOptionIds: ['foreign'],
      }),
    ).toThrow(BadRequestException);
  });

  it('enforces multiple-choice minimum and maximum', () => {
    const validate = validator(service);
    const vote = normalizedVote(VoteBallotType.MULTIPLE_CHOICE, 2, 2);
    expect(() => validate(vote, { selectedOptionIds: ['option-1'] })).toThrow(
      BadRequestException,
    );
    expect(
      validate(vote, { selectedOptionIds: ['option-1', 'option-2'] }),
    ).toEqual({
      selectedOptionIds: ['option-1', 'option-2'],
      ranking: [],
    });
  });

  it('requires a complete ranking with unique ranks', () => {
    const validate = validator(service);
    const vote = normalizedVote(VoteBallotType.RANKING);
    const selectedOptionIds = ['option-1', 'option-2'];
    expect(
      validate(vote, {
        selectedOptionIds,
        ranking: [
          { optionId: 'option-2', rank: 2 },
          { optionId: 'option-1', rank: 1 },
        ],
      }),
    ).toEqual({
      selectedOptionIds,
      ranking: [
        { optionId: 'option-1', rank: 1 },
        { optionId: 'option-2', rank: 2 },
      ],
    });
    expect(() =>
      validate(vote, {
        selectedOptionIds,
        ranking: [
          { optionId: 'option-1', rank: 1 },
          { optionId: 'option-2', rank: 1 },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('aggregates deterministic Borda results without voter identities', async () => {
    answerModelMock.find.mockReturnValue(
      selectOrLeanExecResult([
        {
          userId: 'alice',
          selectedOptionIds: ['option-1', 'option-2'],
          ranking: [
            { optionId: 'option-1', rank: 1 },
            { optionId: 'option-2', rank: 2 },
          ],
        },
        {
          userId: 'bob',
          selectedOptionIds: ['option-1', 'option-2'],
          ranking: [
            { optionId: 'option-2', rank: 1 },
            { optionId: 'option-1', rank: 2 },
          ],
        },
      ]),
    );
    type AggregateResult = {
      totalAnswers: number;
      rankingPolicy: {
        method: string;
        pointsPerRank: string;
        tieBreak: string;
      } | null;
      results: Array<{
        option: { id: string };
        bordaScore: number | null;
      }>;
    };
    const aggregate = (
      service as unknown as {
        aggregateResults(
          vote: ReturnType<typeof normalizeVoteRecord>,
        ): Promise<AggregateResult>;
      }
    ).aggregateResults.bind(service);

    const results = await aggregate(normalizedVote(VoteBallotType.RANKING));

    expect(results.totalAnswers).toBe(2);
    expect(results.rankingPolicy?.method).toBe('borda');
    expect(results.rankingPolicy?.pointsPerRank).toBe('N - rank');
    expect(results.rankingPolicy?.tieBreak).toBe('option_order');
    expect(results.results).toHaveLength(2);
    expect(results.results[0]?.option.id).toBe('option-1');
    expect(results.results[0]?.bordaScore).toBe(1);
    expect(results.results[1]?.option.id).toBe('option-2');
    expect(results.results[1]?.bordaScore).toBe(1);
    expect(JSON.stringify(results)).not.toContain('alice');
    expect(JSON.stringify(results)).not.toContain('bob');
    expect(JSON.stringify(results)).not.toContain('userId');
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function leanExecResult<T>(value: T) {
  return {
    lean: jest.fn().mockReturnValue(execResult(value)),
  };
}

function selectLeanExecResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnValue(leanExecResult(value)),
  };
}

function selectOrLeanExecResult<T>(value: T) {
  return {
    lean: jest.fn().mockReturnValue(execResult(value)),
    select: jest.fn().mockReturnValue(leanExecResult(value)),
  };
}

function voteDocument() {
  const now = Date.now();
  return {
    _id: 'vote_1',
    id: 'vote_1',
    title: 'Quel jour choisir ?',
    description: 'Choisissez le meilleur jour.',
    createdById: 'creator',
    neighborhoodId: 'quartier-centre',
    status: VoteStatus.OPEN,
    ballotType: VoteBallotType.SINGLE_CHOICE,
    privacy: VotePrivacy.ANONYMOUS,
    resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
    options: [
      { id: 'option-1', label: 'Samedi', description: null, order: 0 },
      { id: 'option-2', label: 'Dimanche', description: null, order: 1 },
    ],
    opensAt: new Date(now - 60_000),
    closesAt: new Date(now + 86_400_000),
    allowAnswerChange: true,
    history: [],
    publishedAt: new Date(now - 60_000),
  };
}

function user(sub: string, role = Role.RESIDENT) {
  return {
    sub,
    role,
    neighborhoodId: 'quartier-centre',
  };
}

function normalizedVote(
  ballotType: VoteBallotType,
  minSelections?: number,
  maxSelections?: number,
) {
  return normalizeVoteRecord({
    _id: 'vote-1',
    title: 'Vote de test',
    ballotType,
    privacy: VotePrivacy.ANONYMOUS,
    resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
    neighborhoodId: 'quartier-centre',
    minSelections,
    maxSelections,
    options: [
      { id: 'option-1', label: 'Première', order: 0 },
      { id: 'option-2', label: 'Deuxième', order: 1 },
    ],
    opensAt: new Date(Date.now() - 60_000),
    closesAt: new Date(Date.now() + 60_000),
    status: VoteStatus.OPEN,
  });
}

function validator(service: VotesService) {
  return (
    service as unknown as {
      validateAnswer(
        vote: ReturnType<typeof normalizeVoteRecord>,
        dto: {
          selectedOptionIds: string[];
          ranking?: Array<{ optionId: string; rank: number }>;
        },
      ): {
        selectedOptionIds: string[];
        ranking: Array<{ optionId: string; rank: number }>;
      };
    }
  ).validateAnswer.bind(service);
}
