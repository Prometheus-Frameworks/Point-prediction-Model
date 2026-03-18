import type { AdjustedPlayerInputs } from '../models/adjustments/tradeAdjustment.js';
import type { ProjectionBreakdown } from '../types/projection.js';
import type { TeamContext } from '../types/team.js';
import { roundTo } from './math.js';

const describeChange = (label: string, value: number): string => {
  const percent = roundTo((value - 1) * 100, 1);
  if (percent === 0) {
    return `${label}: no meaningful change.`;
  }

  const direction = percent > 0 ? 'increase' : 'decrease';
  return `${label}: ${Math.abs(percent)}% ${direction}.`;
};

export const buildTradeExplanation = (
  priorTeam: TeamContext,
  currentTeam: TeamContext,
  adjustedInputs: AdjustedPlayerInputs,
  baseline: ProjectionBreakdown,
  adjusted: ProjectionBreakdown,
): string[] => {
  return [
    `${priorTeam.team} → ${currentTeam.team}: context updated for ${currentTeam.quarterback} and the new passing environment.`,
    describeChange('Play volume and pass rate effect on routes', adjustedInputs.multipliers.volume),
    describeChange('Target competition effect on target share', adjustedInputs.multipliers.competition),
    describeChange('Quarterback efficiency effect on catch rate and yards per target', adjustedInputs.multipliers.qbEfficiency),
    describeChange('Pass TD environment effect on touchdown rate', adjustedInputs.multipliers.passTdEnvironment),
    `Projection moved from ${baseline.pprPointsPerGame} to ${adjusted.pprPointsPerGame} PPR/G (${roundTo(adjusted.pprPointsPerGame - baseline.pprPointsPerGame)} delta).`,
  ];
};
