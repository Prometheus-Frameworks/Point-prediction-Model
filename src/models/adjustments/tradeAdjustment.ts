import type { ProjectionEvent } from '../../types/event.js';
import type { PlayerProfile } from '../../types/player.js';
import type { TeamContext } from '../../types/team.js';
import { clamp, roundTo } from '../../utils/math.js';

export interface AdjustedPlayerInputs {
  routesPerGame: number;
  targetsPerRouteRun: number;
  catchRate: number;
  yardsPerTarget: number;
  tdPerTarget: number;
  rushPointsPerGame?: number;
  multipliers: {
    volume: number;
    competition: number;
    qbEfficiency: number;
    passTdEnvironment: number;
  };
}

const deriveBoundedMultiplier = (
  previousIndex: number,
  nextIndex: number,
  sensitivity: number,
  cap: number,
): number => {
  const delta = (nextIndex - previousIndex) / previousIndex;
  return clamp(1 + delta * sensitivity, 1 - cap, 1 + cap);
};

export const applyTradeAdjustment = (
  player: PlayerProfile,
  previousTeam: TeamContext,
  nextTeam: TeamContext,
  event: ProjectionEvent,
): AdjustedPlayerInputs => {
  if (event.type !== 'PLAYER_TRADE') {
    return {
      routesPerGame: player.routesPerGame,
      targetsPerRouteRun: player.targetsPerRouteRun,
      catchRate: player.catchRate,
      yardsPerTarget: player.yardsPerTarget,
      tdPerTarget: player.tdPerTarget,
      rushPointsPerGame: player.rushPointsPerGame,
      multipliers: {
        volume: 1,
        competition: 1,
        qbEfficiency: 1,
        passTdEnvironment: 1,
      },
    };
  }

  const volumeMultiplier = clamp(
    deriveBoundedMultiplier(previousTeam.playVolumeIndex, nextTeam.playVolumeIndex, 0.45, 0.12) *
      deriveBoundedMultiplier(previousTeam.passRateIndex, nextTeam.passRateIndex, 0.55, 0.12),
    0.82,
    1.18,
  );
  const competitionMultiplier = deriveBoundedMultiplier(
    previousTeam.targetCompetitionIndex,
    nextTeam.targetCompetitionIndex,
    -0.65,
    0.15,
  );
  const qbEfficiencyMultiplier = deriveBoundedMultiplier(
    previousTeam.qbEfficiencyIndex,
    nextTeam.qbEfficiencyIndex,
    0.5,
    0.12,
  );
  const passTdMultiplier = deriveBoundedMultiplier(
    previousTeam.passTdEnvironmentIndex,
    nextTeam.passTdEnvironmentIndex,
    0.65,
    0.18,
  );

  return {
    routesPerGame: roundTo(player.routesPerGame * volumeMultiplier),
    targetsPerRouteRun: roundTo(player.targetsPerRouteRun * competitionMultiplier, 4),
    catchRate: roundTo(clamp(player.catchRate * qbEfficiencyMultiplier, 0.45, 0.85), 4),
    yardsPerTarget: roundTo(player.yardsPerTarget * qbEfficiencyMultiplier, 3),
    tdPerTarget: roundTo(player.tdPerTarget * passTdMultiplier, 4),
    rushPointsPerGame: player.rushPointsPerGame,
    multipliers: {
      volume: roundTo(volumeMultiplier, 3),
      competition: roundTo(competitionMultiplier, 3),
      qbEfficiency: roundTo(qbEfficiencyMultiplier, 3),
      passTdEnvironment: roundTo(passTdMultiplier, 3),
    },
  };
};
