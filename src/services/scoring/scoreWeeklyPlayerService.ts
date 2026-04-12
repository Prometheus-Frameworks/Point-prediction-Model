import { calculateRangeProfile } from '../../calculators/range/calculateRangeProfile.js';
import { calculateStabilityScore } from '../../calculators/range/calculateStabilityScore.js';
import { calculateReplacementBaselines } from '../../calculators/replacement/calculateReplacementBaselines.js';
import { calculateVorp } from '../../calculators/vorp/calculateVorp.js';
import { calculateExpectedPoints } from '../../calculators/xfpg/calculateExpectedPoints.js';
import type { ScoredPlayerOutput, WeeklyScoringRequest } from '../../contracts/scoring.js';
import { serviceSuccess } from '../result.js';
import type { ServiceResult } from '../result.js';

export interface WeeklyPlayerScoreOutput {
  player: ScoredPlayerOutput;
}

export const scoreWeeklyPlayerService = (
  request: WeeklyScoringRequest,
): ServiceResult<WeeklyPlayerScoreOutput> => {
  if (request.players.length !== 1) {
    return {
      ok: false,
      warnings: [],
      errors: [{ code: 'EXPECTED_SINGLE_PLAYER', message: 'Single player scoring expects exactly one player input.' }],
    };
  }

  const xfpgPlayers = request.players.map((player) => ({ ...player, __xfpg: calculateExpectedPoints(player) }));
  const baselines = calculateReplacementBaselines(xfpgPlayers, request.league_context);
  const player = xfpgPlayers[0];
  const stability = calculateStabilityScore(player);
  const range = calculateRangeProfile(player.__xfpg, stability.volatility_input, stability.fragility_input);
  const replacement = baselines[player.position].replacement_points;

  return serviceSuccess({
    player: {
      player_id: player.player_id,
      player_name: player.player_name,
      team: player.team,
      position: player.position,
      expected_points: player.__xfpg,
      replacement_points: replacement,
      vorp: calculateVorp(player.__xfpg, replacement),
      floor: range.floor,
      median: range.median,
      ceiling: range.ceiling,
      confidence_band: stability.confidence_band,
      volatility_tag: range.volatility_tag,
      fragility_tag: range.fragility_tag,
      role_notes: stability.role_notes,
    },
  });
};
