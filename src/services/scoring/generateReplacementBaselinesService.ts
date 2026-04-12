import { calculateReplacementBaselines } from '../../calculators/replacement/calculateReplacementBaselines.js';
import { calculateExpectedPoints } from '../../calculators/xfpg/calculateExpectedPoints.js';
import type { LeagueContextInput, PlayerOpportunityInput, ReplacementBaseline, ScoringPosition } from '../../contracts/scoring.js';
import { serviceSuccess } from '../result.js';
import type { ServiceResult } from '../result.js';

export interface ReplacementBaselinesOutput {
  generated_at: string;
  baselines: Record<ScoringPosition, ReplacementBaseline>;
}

export const generateReplacementBaselinesService = (
  players: PlayerOpportunityInput[],
  leagueContext: LeagueContextInput,
): ServiceResult<ReplacementBaselinesOutput> => {
  const xfpgPlayers = players.map((player) => ({ ...player, __xfpg: calculateExpectedPoints(player) }));

  return serviceSuccess({
    generated_at: new Date().toISOString(),
    baselines: calculateReplacementBaselines(xfpgPlayers, leagueContext),
  });
};
