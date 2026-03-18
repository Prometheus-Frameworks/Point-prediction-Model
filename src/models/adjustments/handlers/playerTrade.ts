import type { ProjectionEvent } from '../../../types/event.js';
import type { PlayerProfile } from '../../../types/player.js';
import type { TeamContext } from '../../../types/team.js';
import { clamp } from '../../../utils/math.js';
import { buildAdjustedInputs, deriveBoundedMultiplier } from '../helpers.js';

export const applyPlayerTradeAdjustment = (
  player: PlayerProfile,
  previousTeam: TeamContext,
  nextTeam: TeamContext,
  event: ProjectionEvent,
) => {
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

  return buildAdjustedInputs(
    player,
    {
      volume: volumeMultiplier,
      competition: competitionMultiplier,
      qbEfficiency: qbEfficiencyMultiplier,
      passTdEnvironment: passTdMultiplier,
    },
    [
      event.description,
      `${previousTeam.team} to ${nextTeam.team} changes overall play volume and pass rate expectations.`,
      `Target competition shifts from ${previousTeam.targetCompetitionIndex} to ${nextTeam.targetCompetitionIndex}.`,
      `Quarterback efficiency changes from ${previousTeam.qbEfficiencyIndex} to ${nextTeam.qbEfficiencyIndex}.`,
      `Passing touchdown environment changes from ${previousTeam.passTdEnvironmentIndex} to ${nextTeam.passTdEnvironmentIndex}.`,
    ],
    event.materiallyChangedVariables ?? [
      'routesPerGame',
      'targetsPerRouteRun',
      'catchRate',
      'yardsPerTarget',
      'tdPerTarget',
    ],
  );
};
