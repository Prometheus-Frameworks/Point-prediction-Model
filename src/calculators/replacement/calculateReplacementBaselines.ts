import type { LeagueContextInput, PlayerOpportunityInput, ReplacementBaseline, ScoringPosition } from '../../contracts/scoring.js';
import { roundTo } from '../../core/scoringSystem.js';

const baseStarterSlots = (league: LeagueContextInput): Record<ScoringPosition, number> => ({
  QB: league.teams * league.starters.QB,
  RB: league.teams * league.starters.RB,
  WR: league.teams * league.starters.WR,
  TE: league.teams * league.starters.TE,
});

const positionPool = (players: XfpgPlayer[], position: ScoringPosition) =>
  players.filter((player) => player.position === position).sort((a, b) => (b.__xfpg ?? 0) - (a.__xfpg ?? 0));

type XfpgPlayer = PlayerOpportunityInput & { __xfpg?: number };

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
