import { buildDefaultReplacementPoints } from '../../calculators/replacement/buildDefaultReplacementPoints.js';
import { calculateReplacementBaselines } from '../../calculators/replacement/calculateReplacementBaselines.js';
import { calculateExpectedPoints } from '../../calculators/xfpg/calculateExpectedPoints.js';
import type { WeeklyScoringRequest } from '../../contracts/scoring.js';

type XfpgPlayer = WeeklyScoringRequest['players'][number] & { __xfpg: number };

export const resolveReplacementPoints = (
  request: WeeklyScoringRequest,
  _scoredPlayers: XfpgPlayer[],
): Record<'QB' | 'RB' | 'WR' | 'TE', number> => {
  const baselinePoolInputs = [...(request.comparison_pool ?? []), ...request.players];

  if (baselinePoolInputs.length >= 8) {
    const baselinePool = baselinePoolInputs.map((player) => ({
      ...player,
      __xfpg: calculateExpectedPoints(player),
    }));

    const calculated = calculateReplacementBaselines(baselinePool, request.league_context);

    return {
      QB: request.replacement_points_override?.QB ?? calculated.QB.replacement_points,
      RB: request.replacement_points_override?.RB ?? calculated.RB.replacement_points,
      WR: request.replacement_points_override?.WR ?? calculated.WR.replacement_points,
      TE: request.replacement_points_override?.TE ?? calculated.TE.replacement_points,
    };
  }

  return buildDefaultReplacementPoints(request.league_context, request.replacement_points_override);
};
