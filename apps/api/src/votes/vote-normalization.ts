import { Types } from 'mongoose';

import {
  VoteBallotType,
  VotePrivacy,
  VoteResultsVisibility,
  VoteStatus,
} from './schemas/vote.schema';

type LegacyVoteOption = {
  id?: unknown;
  label?: unknown;
  description?: unknown;
  order?: unknown;
};

type VoteLike = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  question?: unknown;
  description?: unknown;
  ballotType?: VoteBallotType;
  privacy?: VotePrivacy;
  resultsVisibility?: VoteResultsVisibility;
  allowAnswerChange?: boolean;
  allowMultipleChoices?: boolean;
  opensAt?: Date | string;
  closesAt?: Date | string;
  status?: VoteStatus;
  options?: LegacyVoteOption[];
  createdAt?: Date | string;
  neighborhoodId?: string;
  minSelections?: number | null;
  maxSelections?: number | null;
};

export type NormalizedVote = Omit<
  VoteLike,
  | 'id'
  | 'question'
  | 'title'
  | 'description'
  | 'ballotType'
  | 'privacy'
  | 'resultsVisibility'
  | 'allowAnswerChange'
  | 'allowMultipleChoices'
  | 'opensAt'
  | 'closesAt'
  | 'status'
  | 'options'
> & {
  id: string | null;
  title: string;
  description: string;
  ballotType: VoteBallotType;
  privacy: VotePrivacy;
  resultsVisibility: VoteResultsVisibility;
  allowAnswerChange: boolean;
  opensAt: Date;
  closesAt: Date;
  status: VoteStatus;
  storedStatus: VoteStatus;
  options: Array<{
    id: string;
    label: string;
    description: string | null;
    order: number;
  }>;
};

export function normalizeVoteRecord(
  vote: VoteLike,
  now = new Date(),
): NormalizedVote {
  const title = text(vote.title) ?? text(vote.question) ?? 'Vote sans titre';
  const ballotType =
    vote.ballotType ??
    (vote.allowMultipleChoices
      ? VoteBallotType.MULTIPLE_CHOICE
      : VoteBallotType.SINGLE_CHOICE);
  const opensAt = toDate(vote.opensAt) ?? toDate(vote.createdAt) ?? new Date(0);
  const closesAt = toDate(vote.closesAt) ?? new Date(0);
  const storedStatus = vote.status ?? VoteStatus.DRAFT;
  const canonical = { ...vote };
  delete canonical.question;
  delete canonical.allowMultipleChoices;

  return {
    ...canonical,
    id: resolveId(vote),
    title,
    description: text(vote.description) ?? '',
    ballotType,
    privacy: vote.privacy ?? VotePrivacy.PUBLIC,
    resultsVisibility: vote.resultsVisibility ?? VoteResultsVisibility.ALWAYS,
    allowAnswerChange: vote.allowAnswerChange ?? true,
    opensAt,
    closesAt,
    status: effectiveVoteStatus(storedStatus, opensAt, closesAt, now),
    storedStatus,
    options: (vote.options ?? []).map((option, index) => ({
      id:
        typeof option.id === 'string'
          ? option.id
          : `legacy-option-${index + 1}`,
      label: text(option.label) ?? `Option ${index + 1}`,
      description: text(option.description),
      order: typeof option.order === 'number' ? option.order : index,
    })),
  } as NormalizedVote;
}

export function effectiveVoteStatus(
  status: VoteStatus,
  opensAt: Date,
  closesAt: Date,
  now = new Date(),
) {
  if ([VoteStatus.CANCELLED, VoteStatus.ARCHIVED].includes(status))
    return status;
  if (status === VoteStatus.CLOSED || closesAt.getTime() <= now.getTime()) {
    return VoteStatus.CLOSED;
  }
  if (
    [VoteStatus.OPEN, VoteStatus.SCHEDULED].includes(status) &&
    opensAt.getTime() <= now.getTime()
  ) {
    return VoteStatus.OPEN;
  }
  if (status === VoteStatus.OPEN && opensAt.getTime() > now.getTime()) {
    return VoteStatus.SCHEDULED;
  }
  return status;
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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
