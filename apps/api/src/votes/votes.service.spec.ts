import { ForbiddenException } from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { VoteStatus } from './schemas/vote.schema';
import { VotesService } from './votes.service';

describe('VotesService', () => {
  let service: VotesService;

  const voteModelMock = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const answerModelMock = {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VotesService(
      voteModelMock as never,
      answerModelMock as never,
    );
  });

  it('should allow the creator to close their vote', async () => {
    const vote = voteDocument({ createdById: 'creator' });
    const closedVote = {
      ...vote,
      status: VoteStatus.CLOSED,
    };

    voteModelMock.findById.mockReturnValue(execResult(vote));
    voteModelMock.findByIdAndUpdate.mockReturnValue(execResult(closedVote));

    const result = await service.close('vote_1', user('creator'));

    expect(voteModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'vote_1',
      { status: VoteStatus.CLOSED },
      { returnDocument: 'after' },
    );
    expect(result).toEqual(closedVote);
  });

  it('should allow an admin to close another user vote', async () => {
    const vote = voteDocument({ createdById: 'creator' });
    const closedVote = {
      ...vote,
      status: VoteStatus.CLOSED,
    };

    voteModelMock.findById.mockReturnValue(execResult(vote));
    voteModelMock.findByIdAndUpdate.mockReturnValue(execResult(closedVote));

    await expect(
      service.close('vote_1', user('admin', Role.ADMIN)),
    ).resolves.toEqual(closedVote);
  });

  it('should allow a moderator to close another user vote', async () => {
    const vote = voteDocument({ createdById: 'creator' });
    const closedVote = {
      ...vote,
      status: VoteStatus.CLOSED,
    };

    voteModelMock.findById.mockReturnValue(execResult(vote));
    voteModelMock.findByIdAndUpdate.mockReturnValue(execResult(closedVote));

    await expect(
      service.close('vote_1', user('moderator', Role.MODERATOR)),
    ).resolves.toEqual(closedVote);
  });

  it('should reject closing another user vote as a resident', async () => {
    voteModelMock.findById.mockReturnValue(
      execResult(voteDocument({ createdById: 'creator' })),
    );

    await expect(service.close('vote_1', user('other'))).rejects.toThrow(
      ForbiddenException,
    );
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function voteDocument(input: { createdById: string }) {
  return {
    id: 'vote_1',
    question: 'Quel jour choisir ?',
    createdById: input.createdById,
    status: VoteStatus.OPEN,
    options: [],
    closesAt: new Date(Date.now() + 86_400_000),
    allowMultipleChoices: false,
  };
}

function user(sub: string, role = Role.RESIDENT) {
  return {
    sub,
    role,
  };
}
