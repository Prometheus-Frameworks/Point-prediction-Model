import type { ProjectionEvent } from '../../../types/event.js';
import type { PlayerProfile } from '../../../types/player.js';
import type { TeamContext } from '../../../types/team.js';
import { clamp } from '../../../utils/math.js';
import { buildAdjustedInputs } from '../helpers.js';

export const applyPlayerSigningAdjustment = (
  player: PlayerProfile,
  previousTeam: TeamContext,
  nextTeam: TeamContext,
  event: ProjectionEvent,
) => {
  const severity = clamp(event.severity ?? 5, 1, 10);
  const competitionPenalty = 1 - severity * 0.012;
  const routePenalty = 1 - severity * 0.006;
  const tdPenalty = 1 - severity * 0.007;

  return buildAdjustedInputs(
    player,
    {
      volume: clamp(routePenalty, 0.94, 1),
      competition: clamp(competitionPenalty, 0.88, 0.99),
      qbEfficiency: clamp(1 + (nextTeam.qbEfficiencyIndex - previousTeam.qbEfficiencyIndex) / 1400, 0.97, 1.03),
      passTdEnvironment: clamp(tdPenalty, 0.92, 1),
    },
    [
      event.description,
      `New veteran additions primarily create target competition, reducing opportunity at severity ${severity}/10.`,
      'Routes slip slightly when the offense has one more viable receiving option in core personnel.',
      'Touchdown share is trimmed modestly because additional pass-catchers can siphon red-zone looks.',
    ],
    event.materiallyChangedVariables ?? ['routesPerGame', 'targetsPerRouteRun', 'tdPerTarget'],
  );
};
