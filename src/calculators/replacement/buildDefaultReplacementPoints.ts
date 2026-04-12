import type { LeagueContextInput, ReplacementPointsOverride, ScoringPosition } from '../../contracts/scoring.js';
import { clamp, roundTo } from '../../core/scoringSystem.js';

const base12TeamReplacement: Record<ScoringPosition, number> = {
  QB: 16,
  RB: 9.5,
  WR: 10,
  TE: 7,
};

const normalizeFlexAllocation = (leagueContext: LeagueContextInput): Record<'RB' | 'WR' | 'TE', number> => {
  const configured = leagueContext.flex_allocation;

  const rb = clamp(configured?.RB ?? 0.35, 0, 1);
  const wr = clamp(configured?.WR ?? 0.5, 0, 1);
  const te = clamp(configured?.TE ?? 0.15, 0, 1);
  const total = rb + wr + te;

  if (total <= 0) {
    return { RB: 0.35, WR: 0.5, TE: 0.15 };
  }

  return {
    RB: rb / total,
    WR: wr / total,
    TE: te / total,
  };
};

export const buildDefaultReplacementPoints = (
  leagueContext: LeagueContextInput,
  overrides?: ReplacementPointsOverride,
): Record<ScoringPosition, number> => {
  const teamDelta = (leagueContext.teams - 12) * 0.35;
  const starters = leagueContext.starters;
  const flexSlots = starters.FLEX ?? 0;
  const flexAllocation = normalizeFlexAllocation(leagueContext);

  const starterDemand = {
    QB: leagueContext.teams * starters.QB,
    RB: leagueContext.teams * (starters.RB + flexSlots * flexAllocation.RB),
    WR: leagueContext.teams * (starters.WR + flexSlots * flexAllocation.WR),
    TE: leagueContext.teams * (starters.TE + flexSlots * flexAllocation.TE),
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
