import type { ProjectionEvent } from '../../../types/event.js';
import type { PlayerProfile } from '../../../types/player.js';
import type { TeamContext } from '../../../types/team.js';
import { clamp } from '../../../utils/math.js';
import { buildAdjustedInputs } from '../helpers.js';

export const applyRookieAddedAdjustment = (
  player: PlayerProfile,
  previousTeam: TeamContext,
  nextTeam: TeamContext,
  event: ProjectionEvent,
) => {
  const severity = clamp(event.severity ?? 4, 1, 10);
  const competitionPenalty = 1 - severity * 0.008;
  const routePenalty = 1 - severity * 0.003;
  const efficiencyDrift = 1 - severity * 0.002;

  return buildAdjustedInputs(
    player,
    {
      volume: clamp(routePenalty, 0.96, 1),
      competition: clamp(competitionPenalty, 0.92, 0.995),
      qbEfficiency: clamp(efficiencyDrift, 0.97, 1),
      passTdEnvironment: clamp(1 - severity * 0.003, 0.96, 1),
    },
    [
      event.description,
      `Rookie additions are inherently uncertain, so competition adjustments stay modest even at severity ${severity}/10.`,
      'The model assumes rookies can earn snaps gradually rather than immediately displacing established pass-catchers.',
      'Any touchdown impact is deliberately small because rookie role translation is one of the least certain inputs.',
    ],
    event.materiallyChangedVariables ?? ['routesPerGame', 'targetsPerRouteRun', 'catchRate', 'yardsPerTarget', 'tdPerTarget'],
  );
};
