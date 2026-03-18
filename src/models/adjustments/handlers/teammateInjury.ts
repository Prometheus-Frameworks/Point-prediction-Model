import type { ProjectionEvent } from '../../../types/event.js';
import type { PlayerProfile } from '../../../types/player.js';
import type { TeamContext } from '../../../types/team.js';
import { clamp } from '../../../utils/math.js';
import { buildAdjustedInputs } from '../helpers.js';

export const applyTeammateInjuryAdjustment = (
  player: PlayerProfile,
  previousTeam: TeamContext,
  nextTeam: TeamContext,
  event: ProjectionEvent,
) => {
  const severity = clamp(event.severity ?? 6, 1, 10);
  const opportunityBoost = 1 + severity * 0.012;
  const routeBoost = 1 + severity * 0.004;
  const touchdownBoost = 1 + severity * 0.006;

  return buildAdjustedInputs(
    player,
    {
      volume: clamp(routeBoost, 1, 1.05),
      competition: clamp(opportunityBoost, 1.01, 1.12),
      qbEfficiency: clamp(1 + (nextTeam.qbEfficiencyIndex - previousTeam.qbEfficiencyIndex) / 1000, 0.98, 1.02),
      passTdEnvironment: clamp(touchdownBoost, 1, 1.06),
    },
    [
      event.description,
      `Injuries mostly redistribute targets, so target share gets the largest bump at severity ${severity}/10.`,
      'Routes can rise slightly if the player rarely leaves the field in two-receiver or two-tight-end sets.',
      'Touchdown rate gets only a modest lift because red-zone roles can be shared across replacements.',
    ],
    event.materiallyChangedVariables ?? ['routesPerGame', 'targetsPerRouteRun', 'tdPerTarget'],
  );
};
