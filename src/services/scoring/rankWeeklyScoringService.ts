import type { ScoredPlayerOutput, WeeklyScoringRequest } from '../../contracts/scoring.js';
import { scoreWeeklyBatchService } from './scoreWeeklyBatchService.js';
import type { ServiceResult } from '../result.js';

export interface WeeklyRankingsOutput {
  generated_at: string;
  rankings: Array<ScoredPlayerOutput & { rank: number }>;
}

export const rankWeeklyScoringService = (request: WeeklyScoringRequest): ServiceResult<WeeklyRankingsOutput> => {
  const scoredResult = scoreWeeklyBatchService(request);
  if (!scoredResult.ok) {
    return scoredResult;
  }

  return {
    ok: true,
    warnings: scoredResult.warnings,
    errors: [],
    data: {
      generated_at: scoredResult.data.generated_at,
      rankings: scoredResult.data.players
        .slice()
        .sort((a, b) => b.vorp - a.vorp)
        .map((player, index) => ({ ...player, rank: index + 1 })),
    },
  };
};
