import type { LeagueContextInput, PlayerOpportunityInput, ReplacementBaseline, ScoringPosition } from '../../contracts/scoring.js';
import { roundTo } from '../../core/scoringSystem.js';

type XfpgPlayer = PlayerOpportunityInput & { __xfpg?: number };

const normalizeFlexAllocation = (league: LeagueContextInput) => {
  const configured = league.flex_allocation;
  const rb = configured?.RB ?? 0.35;
  const wr = configured?.WR ?? 0.5;
  const te = configured?.TE ?? 0.15;
  const total = rb + wr + te;

  if (total <= 0) {
    return { RB: 0.35, WR: 0.5, TE: 0.15 };
  }

  return { RB: rb / total, WR: wr / total, TE: te / total };
};

const baseStarterSlots = (league: LeagueContextInput): Record<ScoringPosition, number> => {
  const flexSlots = league.teams * (league.starters.FLEX ?? 0);
  const flexAllocation = normalizeFlexAllocation(league);

  return {
    QB: league.teams * league.starters.QB,
    RB: league.teams * league.starters.RB + flexSlots * flexAllocation.RB,
    WR: league.teams * league.starters.WR + flexSlots * flexAllocation.WR,
    TE: league.teams * league.starters.TE + flexSlots * flexAllocation.TE,
  };
};

const positionPool = (players: XfpgPlayer[], position: ScoringPosition) =>
  players.filter((player) => player.position === position).sort((a, b) => (b.__xfpg ?? 0) - (a.__xfpg ?? 0));

export const calculateReplacementBaselines = (
  players: XfpgPlayer[],
  league: LeagueContextInput,
): Record<ScoringPosition, ReplacementBaseline> => {
  const starterSlots = baseStarterSlots(league);
  const replacementBuffer = league.replacement_buffer ?? 0.1;

  const resolvePositionReplacement = (position: ScoringPosition): ReplacementBaseline => {
    const pool = positionPool(players, position);
    const starterCount = starterSlots[position];
    const replacementRank = Math.max(1, Math.ceil(starterCount * (1 + replacementBuffer)));
    const replacementPlayer = pool[Math.min(replacementRank - 1, Math.max(0, pool.length - 1))];
    const replacementPoints = replacementPlayer?.__xfpg ?? 0;

    return {
      position,
      replacement_points: roundTo(replacementPoints),
      replacement_rank: replacementRank,
      sample_size: pool.length,
    };
  };

  return {
    QB: resolvePositionReplacement('QB'),
    RB: resolvePositionReplacement('RB'),
    WR: resolvePositionReplacement('WR'),
    TE: resolvePositionReplacement('TE'),
  };
};
