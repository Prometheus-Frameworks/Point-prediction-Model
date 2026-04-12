import { roundTo } from '../../core/scoringSystem.js';
import type { RosScoringRequest, RosScoringResponse } from '../../contracts/scoring.js';
import type { ServiceResult } from '../result.js';
import { scoreWeeklyBatchService } from './scoreWeeklyBatchService.js';

export const scoreRosService = (request: RosScoringRequest): ServiceResult<RosScoringResponse> => {
  const weeklyResult = scoreWeeklyBatchService({
    players: request.players,
    league_context: request.league_context,
  });

  if (!weeklyResult.ok) {
    return weeklyResult;
  }

  const players = weeklyResult.data.players.map((player) => ({
    ...player,
    ros_expected_points: roundTo(player.expected_points * request.remaining_weeks),
    ros_vorp: roundTo(player.vorp * request.remaining_weeks),
  }));

  return {
    ok: true,
    warnings: weeklyResult.warnings,
    errors: [],
    data: {
      generated_at: weeklyResult.data.generated_at,
      remaining_weeks: request.remaining_weeks,
      players,
    },
  };
};
