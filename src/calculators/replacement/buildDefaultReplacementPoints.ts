import type { LeagueContextInput, ReplacementPointsOverride, ScoringPosition } from '../../contracts/scoring.js';
import { clamp, roundTo } from '../../core/scoringSystem.js';

const base12TeamReplacement: Record<ScoringPosition, number> = {
  QB: 16,
  RB: 9.5,
  WR: 10,
  TE: 7,
};

const getFlexShare = (leagueContext: LeagueContextInput, position: 'RB' | 'WR' | 'TE'): number => {
  const explicit = leagueContext.flex_allocation?.[position];
  if (explicit !== undefined) {
    return clamp(explicit, 0, 1);
  }

  if (position === 'TE') {
    return 0.1;
  }

  return 0.45;
};

export const buildDefaultReplacementPoints = (
  leagueContext: LeagueContextInput,
  overrides?: ReplacementPointsOverride,
): Record<ScoringPosition, number> => {
  const teamDelta = (leagueContext.teams - 12) * 0.35;
  const starters = leagueContext.starters;
  const flexSlots = starters.FLEX ?? 0;

  const starterDemand = {
    QB: leagueContext.teams * starters.QB,
    RB: leagueContext.teams * (starters.RB + flexSlots * getFlexShare(leagueContext, 'RB')),
    WR: leagueContext.teams * (starters.WR + flexSlots * getFlexShare(leagueContext, 'WR')),
    TE: leagueContext.teams * (starters.TE + flexSlots * getFlexShare(leagueContext, 'TE')),
  };

  const baselineDemand = {
    QB: 12,
    RB: 29.4,
    WR: 29.4,
    TE: 13.2,
  };

  const demandAdjustment = (position: ScoringPosition): number => {
    const demandDelta = starterDemand[position] - baselineDemand[position];
    const scale = position === 'QB' ? 0.07 : 0.11;
    return demandDelta * scale;
  };

  return {
    QB: roundTo(overrides?.QB ?? (base12TeamReplacement.QB - teamDelta * 0.7 - demandAdjustment('QB'))),
    RB: roundTo(overrides?.RB ?? (base12TeamReplacement.RB - teamDelta * 0.9 - demandAdjustment('RB'))),
    WR: roundTo(overrides?.WR ?? (base12TeamReplacement.WR - teamDelta * 0.85 - demandAdjustment('WR'))),
    TE: roundTo(overrides?.TE ?? (base12TeamReplacement.TE - teamDelta * 0.6 - demandAdjustment('TE'))),
  };
};
