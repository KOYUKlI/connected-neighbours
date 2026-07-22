import { apiRequest } from './client';

export type VoteStatus = 'draft' | 'scheduled' | 'open' | 'closed' | 'cancelled' | 'archived';
export type VoteBallotType = 'yes_no' | 'single_choice' | 'multiple_choice' | 'ranking';
export type VotePrivacy = 'anonymous' | 'public';
export type VoteResultsVisibility = 'always' | 'after_submission' | 'after_close';
export type VoteOption = { id: string; label: string; description?: string | null; order: number };
export type VoteResult = { option: VoteOption; count: number; percentage: number; percentageDenominator: 'respondents'; bordaScore: number | null };
export type VoteResults = {
  totalAnswers: number;
  results: VoteResult[];
  privacy: VotePrivacy;
  anonymity: 'application_level' | 'public_ballot';
  rankingPolicy?: { method: 'borda'; completeRankingRequired: true; pointsPerRank: 'N - rank'; unrankedOptions: 'not_allowed'; tieBreak: 'option_order' } | null;
};
export type VoteItem = {
  id: string;
  title: string;
  description: string;
  neighborhoodId: string;
  ballotType: VoteBallotType;
  privacy: VotePrivacy;
  resultsVisibility: VoteResultsVisibility;
  options: VoteOption[];
  minSelections?: number | null;
  maxSelections?: number | null;
  allowAnswerChange: boolean;
  opensAt: string;
  closesAt: string;
  status: VoteStatus;
  storedStatus: VoteStatus;
  creator: { id: string; displayName: string } | null;
  neighborhood: { id: string; name: string; city?: string | null } | null;
  answersCount: number;
  viewerAnswer: { id: string; selectedOptionIds: string[]; ranking: Array<{ optionId: string; rank: number }>; revision: number } | null;
  results: VoteResults | null;
  resultsAvailable: boolean;
  resultsLockedReason: string | null;
  nextAction: string | null;
  permissions: { canAnswer: boolean; canChangeAnswer: boolean; canViewResults: boolean };
};
export type VotePage = { items: VoteItem[]; page: number; limit: number; total: number; totalPages: number };

function queryString(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function getVotes(query: Record<string, string | number | boolean | undefined> = {}) {
  return apiRequest<VotePage>(`/api/votes${queryString({ page: 1, limit: 20, ...query })}`);
}

export function getVote(id: string) {
  return apiRequest<VoteItem>(`/api/votes/${id}`);
}

export function answerVote(id: string, selectedOptionIds: string[], ranking?: Array<{ optionId: string; rank: number }>) {
  return apiRequest<{ unchanged: boolean }>(`/api/votes/${id}/answers`, {
    method: 'POST',
    body: JSON.stringify({ selectedOptionIds, ...(ranking ? { ranking } : {}) }),
  });
}

export function getVoteResults(id: string) {
  return apiRequest<VoteResults>(`/api/votes/${id}/results`);
}
