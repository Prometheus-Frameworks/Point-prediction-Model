import type { PlayerProfile } from '../../types/player.js';
import type { ProjectionBreakdown } from '../../types/projection.js';
import { roundTo } from '../../utils/math.js';

export const calculateBaselineProjection = (
  player: PlayerProfile,
): ProjectionBreakdown => {
  const targetsPerGame = player.routesPerGame * player.targetsPerRouteRun;
  const receptionsPerGame = targetsPerGame * player.catchRate;
  const yardsPerGame = targetsPerGame * player.yardsPerTarget;
  const tdsPerGame = targetsPerGame * player.tdPerTarget;
  const rushPointsPerGame = player.rushPointsPerGame ?? 0;
  const pprPointsPerGame =
    receptionsPerGame + yardsPerGame * 0.1 + tdsPerGame * 6 + rushPointsPerGame;

  return {
    targetsPerGame: roundTo(targetsPerGame),
    receptionsPerGame: roundTo(receptionsPerGame),
    yardsPerGame: roundTo(yardsPerGame),
    tdsPerGame: roundTo(tdsPerGame),
    rushPointsPerGame: roundTo(rushPointsPerGame),
    pprPointsPerGame: roundTo(pprPointsPerGame),
  };
};
