import { calculateBaselineProjection } from '../baseline/wrProjection.js';
import { calculateConfidenceScore } from '../adjustments/confidenceScore.js';
import { dispatchEventAdjustment } from '../adjustments/dispatchEventAdjustment.js';
import type { ProjectionOutput, ProjectionBreakdown } from '../../types/projection.js';
import type { PlayerProfile } from '../../types/player.js';
import type { TeamContext } from '../../types/team.js';
import type { ProjectionEvent } from '../../types/event.js';
import { roundTo } from '../../utils/math.js';

const subtractBreakdowns = (
  adjusted: ProjectionBreakdown,
  baseline: ProjectionBreakdown,
): ProjectionBreakdown => ({
  targetsPerGame: roundTo(adjusted.targetsPerGame - baseline.targetsPerGame),
  receptionsPerGame: roundTo(adjusted.receptionsPerGame - baseline.receptionsPerGame),
  yardsPerGame: roundTo(adjusted.yardsPerGame - baseline.yardsPerGame),
  tdsPerGame: roundTo(adjusted.tdsPerGame - baseline.tdsPerGame),
  rushPointsPerGame: roundTo(adjusted.rushPointsPerGame - baseline.rushPointsPerGame),
  pprPointsPerGame: roundTo(adjusted.pprPointsPerGame - baseline.pprPointsPerGame),
});

export const projectPlayer = (
  player: PlayerProfile,
  priorTeam: TeamContext,
  currentTeam: TeamContext,
  event?: ProjectionEvent,
): ProjectionOutput => {
  const baseline = calculateBaselineProjection(player);
  const adjustedInputs = dispatchEventAdjustment(player, priorTeam, currentTeam, event);
  const adjusted = calculateBaselineProjection({
    ...player,
    team: currentTeam.team,
    ...adjustedInputs,
  });
  const delta = subtractBreakdowns(adjusted, baseline);
  const confidence = event
    ? calculateConfidenceScore(player, event, adjustedInputs.materiallyChangedVariables)
    : { confidenceScore: 100, confidenceBand: 'HIGH' as const, factors: ['No event uncertainty applied.'] };

  return {
    player,
    priorTeam,
    currentTeam,
    event,
    eventType: event?.type,
    baseline,
    adjusted,
    delta,
    deltaPprPointsPerGame: delta.pprPointsPerGame,
    confidenceScore: confidence.confidenceScore,
    confidenceBand: confidence.confidenceBand,
    explanation: [
      ...adjustedInputs.explanation,
      `Baseline vs adjusted PPR/G: ${baseline.pprPointsPerGame} → ${adjusted.pprPointsPerGame} (${delta.pprPointsPerGame} delta).`,
      ...confidence.factors,
    ],
  };
};
