import type {
  BuildRosPlayerCardOutput,
  BuildWeeklyPlayerCardOutput,
  BuildWeeklyPlayerCardRequest,
  BuildWeeklyRankingsViewOutput,
  BuildWeeklyRankingsViewRequest,
  BuildRosPlayerCardRequest,
} from '../../contracts/tiberScoring.js';
import type { ServiceResult } from '../result.js';
import { scoreRosService } from './scoreRosService.js';
import { scoreWeeklyPlayerService } from './scoreWeeklyPlayerService.js';
import { scoreWeeklyBatchService } from './scoreWeeklyBatchService.js';
import { toTiberRosPlayerCard, toTiberWeeklyPlayerCard, toTiberWeeklyRankingsRow } from '../../transforms/tiberScoring.js';

export const buildWeeklyPlayerCardService = (
  request: BuildWeeklyPlayerCardRequest,
): ServiceResult<BuildWeeklyPlayerCardOutput> => {
  const result = scoreWeeklyPlayerService(request);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    warnings: result.warnings,
    errors: [],
    data: {
      card: toTiberWeeklyPlayerCard(result.data.player, new Date().toISOString()),
    },
  };
};

export const buildWeeklyRankingsViewService = (
  request: BuildWeeklyRankingsViewRequest,
): ServiceResult<BuildWeeklyRankingsViewOutput> => {
  const result = scoreWeeklyBatchService(request);
  if (!result.ok) {
    return result;
  }

  const sortedPlayers = result.data.players
    .slice()
    .sort((a, b) => b.expected_points - a.expected_points || b.vorp - a.vorp || a.player_name.localeCompare(b.player_name));

  return {
    ok: true,
    warnings: result.warnings,
    errors: [],
    data: {
      view: {
        generated_at: result.data.generated_at,
        scoring_mode: 'weekly',
        view_type: 'rankings',
        rows: sortedPlayers.map((player, index) => toTiberWeeklyRankingsRow(player, index + 1)),
      },
    },
  };
};

export const buildRosPlayerCardService = (
  request: BuildRosPlayerCardRequest,
): ServiceResult<BuildRosPlayerCardOutput> => {
  if (request.players.length !== 1) {
    return {
      ok: false,
      warnings: [],
      errors: [{ code: 'EXPECTED_SINGLE_PLAYER', message: 'ROS player card expects exactly one player input.' }],
    };
  }

  const result = scoreRosService(request);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    warnings: result.warnings,
    errors: [],
    data: {
      card: toTiberRosPlayerCard(result.data.players[0], result.data.generated_at, result.data.remaining_weeks),
      remaining_weeks: result.data.remaining_weeks,
    },
  };
};
