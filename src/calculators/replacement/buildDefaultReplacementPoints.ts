import type { LeagueContextInput, ReplacementPointsOverride, ScoringPosition } from '../../contracts/scoring.js';
import { roundTo } from '../../core/scoringSystem.js';

const base12TeamReplacement: Record<ScoringPosition, number> = {
  QB: 16,
  RB: 9.5,
  WR: 10,
  TE: 7,
};

export const buildDefaultReplacementPoints = (
  leagueContext: LeagueContextInput,
  overrides?: ReplacementPointsOverride,
): Record<ScoringPosition, number> => {
  const teamDelta = (leagueContext.teams - 12) * 0.35;

  return {
    QB: roundTo(overrides?.QB ?? (base12TeamReplacement.QB - teamDelta * 0.7)),
    RB: roundTo(overrides?.RB ?? (base12TeamReplacement.RB - teamDelta * 0.9)),
    WR: roundTo(overrides?.WR ?? (base12TeamReplacement.WR - teamDelta * 0.85)),
    TE: roundTo(overrides?.TE ?? (base12TeamReplacement.TE - teamDelta * 0.6)),
  };
};
