import type { ActionTier, DecisionBoardFilters, DecisionBoardPlayer, SortKey } from './types';

const actionTierRank: Record<ActionTier, number> = {
  'Aggressive Buy': 4,
  'Lean Buy': 3,
  Monitor: 2,
  Fade: 1,
};

export const formatPoints = (value: number) => `${value.toFixed(1)} pts`;
export const formatSigned = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

export const getIntervalSummary = (player: DecisionBoardPlayer) =>
  `${player.intervals.lower80.toFixed(1)}–${player.intervals.upper80.toFixed(1)} (80%)`;

export interface PlayerComparisonSummary {
  winner: DecisionBoardPlayer;
  loser: DecisionBoardPlayer;
  projectionDelta: number;
  scenarioDeltaGap: number;
  trustGap: number;
  edgeGap: number;
  winnerIntervalSummary: string;
  loserIntervalSummary: string;
  verdict: string;
}

export const comparePlayers = (left: DecisionBoardPlayer, right: DecisionBoardPlayer): PlayerComparisonSummary => {
  const winner = left.fusedProjection >= right.fusedProjection ? left : right;
  const loser = winner.id === left.id ? right : left;

  const projectionDelta = winner.fusedProjection - loser.fusedProjection;
  const scenarioDeltaGap = winner.scenarioDelta - loser.scenarioDelta;
  const trustGap = winner.trustworthinessScore - loser.trustworthinessScore;
  const edgeGap = winner.marketEdge.trustAdjustedScore - loser.marketEdge.trustAdjustedScore;

  const confidenceLabel = trustGap >= 10 ? 'strong trust edge' : trustGap >= 0 ? 'comparable trust profile' : 'weaker trust profile';
  const edgeLabel = edgeGap >= 10 ? 'clear market edge' : edgeGap >= 0 ? 'slight market edge' : 'market edge trails';
  const closeLabel = projectionDelta < 1.5 ? 'Lean' : 'Winner';
  const verdict = `${closeLabel}: ${winner.playerName} by ${projectionDelta.toFixed(1)} pts · ${confidenceLabel} · ${edgeLabel}`;

  return {
    winner,
    loser,
    projectionDelta,
    scenarioDeltaGap,
    trustGap,
    edgeGap,
    winnerIntervalSummary: getIntervalSummary(winner),
    loserIntervalSummary: getIntervalSummary(loser),
    verdict,
  };
};

export const isStrongEdge = (player: DecisionBoardPlayer) => player.marketEdge.trustAdjustedScore >= 65;

export const getTrustLabel = (score: number) => {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Solid';
  if (score >= 45) return 'Mixed';
  return 'Fragile';
};

export const sortPlayers = (players: DecisionBoardPlayer[], sortKey: SortKey) => {
  const sorted = [...players];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'projection':
        return b.fusedProjection - a.fusedProjection;
      case 'actionability':
        return b.actionabilityScore - a.actionabilityScore || actionTierRank[b.actionTier] - actionTierRank[a.actionTier];
      case 'trustworthiness':
        return b.trustworthinessScore - a.trustworthinessScore;
      case 'edge':
        return b.marketEdge.trustAdjustedScore - a.marketEdge.trustAdjustedScore;
      default:
        return 0;
    }
  });
  return sorted;
};

export const filterPlayers = (players: DecisionBoardPlayer[], filters: DecisionBoardFilters) =>
  players.filter((player) => {
    if (filters.position !== 'ALL' && player.position !== filters.position) return false;
    if (filters.actionTier !== 'ALL' && player.actionTier !== filters.actionTier) return false;
    if (filters.direction !== 'ALL' && player.direction !== filters.direction) return false;
    if (filters.eventDrivenOnly && !player.eventDriven) return false;
    if (filters.strongEdgeOnly && !isStrongEdge(player)) return false;
    return true;
  });
