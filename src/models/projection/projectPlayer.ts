import { applyTradeAdjustment } from '../adjustments/tradeAdjustment.js';
import { calculateBaselineProjection } from '../baseline/wrProjection.js';
import type { ProjectionOutput } from '../../types/projection.js';
import type { PlayerProfile } from '../../types/player.js';
import type { TeamContext } from '../../types/team.js';
import type { ProjectionEvent } from '../../types/event.js';
import { buildTradeExplanation } from '../../utils/explain.js';
import { roundTo } from '../../utils/math.js';

export const projectPlayer = (
  player: PlayerProfile,
  priorTeam: TeamContext,
  currentTeam: TeamContext,
  event?: ProjectionEvent,
): ProjectionOutput => {
  const baseline = calculateBaselineProjection(player);

  if (!event) {
    return {
      player,
      priorTeam,
      currentTeam,
      baseline,
      adjusted: baseline,
      deltaPprPointsPerGame: 0,
      explanation: ['No event applied.'],
    };
  }

  const adjustedInputs = applyTradeAdjustment(player, priorTeam, currentTeam, event);
  const adjusted = calculateBaselineProjection({
    ...player,
    team: currentTeam.team,
    ...adjustedInputs,
  });

  return {
    player,
    priorTeam,
    currentTeam,
    event,
    baseline,
    adjusted,
    deltaPprPointsPerGame: roundTo(adjusted.pprPointsPerGame - baseline.pprPointsPerGame),
    explanation: buildTradeExplanation(priorTeam, currentTeam, adjustedInputs, baseline, adjusted),
  };
};
