import { calculateRangeProfile } from '../../calculators/range/calculateRangeProfile.js';
import { calculateStabilityScore } from '../../calculators/range/calculateStabilityScore.js';
import { calculateReplacementBaselines } from '../../calculators/replacement/calculateReplacementBaselines.js';
import { calculateVorp } from '../../calculators/vorp/calculateVorp.js';
import { calculateExpectedPoints } from '../../calculators/xfpg/calculateExpectedPoints.js';
import type { ScoredPlayerOutput, WeeklyScoringRequest, WeeklyScoringResponse } from '../../contracts/scoring.js';
import { serviceSuccess } from '../result.js';
import type { ServiceResult } from '../result.js';

export const scoreWeeklyBatchService = (request: WeeklyScoringRequest): ServiceResult<WeeklyScoringResponse> => {
  const xfpgPlayers = request.players.map((player) => ({ ...player, __xfpg: calculateExpectedPoints(player) }));
  const baselines = calculateReplacementBaselines(xfpgPlayers, request.league_context);

  const players: ScoredPlayerOutput[] = xfpgPlayers
    .map((player) => {
      const stability = calculateStabilityScore(player);
      const range = calculateRangeProfile(player.__xfpg, stability.volatility_input, stability.fragility_input);
      const replacement = baselines[player.position].replacement_points;

      return {
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
      };
    })
    .sort((a, b) => b.expected_points - a.expected_points);

  return serviceSuccess({
    generated_at: new Date().toISOString(),
    players,
  });
};
