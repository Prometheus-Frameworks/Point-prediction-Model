import { clamp, roundTo } from '../../utils/math.js';
import type { AdjustmentMultipliers, AdjustedProjectionInputs } from './types.js';
import type { PlayerProfile } from '../../types/player.js';

export const deriveBoundedMultiplier = (
  previousIndex: number,
  nextIndex: number,
  sensitivity: number,
  cap: number,
): number => {
  const safePreviousIndex = previousIndex === 0 ? 1 : previousIndex;
  const delta = (nextIndex - safePreviousIndex) / safePreviousIndex;
  return clamp(1 + delta * sensitivity, 1 - cap, 1 + cap);
};

export const identityMultipliers = (): AdjustmentMultipliers => ({
  volume: 1,
  competition: 1,
  qbEfficiency: 1,
  passTdEnvironment: 1,
});

export const buildAdjustedInputs = (
  player: PlayerProfile,
  multipliers: AdjustmentMultipliers,
  explanation: string[],
  materiallyChangedVariables: string[],
): AdjustedProjectionInputs => ({
  routesPerGame: roundTo(player.routesPerGame * multipliers.volume),
  targetsPerRouteRun: roundTo(player.targetsPerRouteRun * multipliers.competition, 4),
  catchRate: roundTo(clamp(player.catchRate * multipliers.qbEfficiency, 0.45, 0.85), 4),
  yardsPerTarget: roundTo(player.yardsPerTarget * multipliers.qbEfficiency, 3),
  tdPerTarget: roundTo(clamp(player.tdPerTarget * multipliers.passTdEnvironment, 0.015, 0.12), 4),
  rushPointsPerGame: player.rushPointsPerGame,
  multipliers: {
    volume: roundTo(multipliers.volume, 3),
    competition: roundTo(multipliers.competition, 3),
    qbEfficiency: roundTo(multipliers.qbEfficiency, 3),
    passTdEnvironment: roundTo(multipliers.passTdEnvironment, 3),
  },
  explanation,
  materiallyChangedVariables,
});
