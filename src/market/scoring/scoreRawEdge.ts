import type { MarketComparisonOutput } from '../types/edgeOutput.js';

const roundToTenth = (value: number): number => Number(value.toFixed(1));

export const scoreRawEdge = (rawDelta: number, modelRank?: number, consensusRank?: number): number => {
  const magnitude = Math.abs(rawDelta);
  if (magnitude < 0.25) {
    return 0;
  }

  const deltaScore = Math.min(100, magnitude * 14);
  const rankBonus = modelRank !== undefined && consensusRank !== undefined
    ? Math.min(10, Math.abs(modelRank - consensusRank) * 2)
    : 0;

  return roundToTenth(Math.min(100, deltaScore + rankBonus));
};

export const scoreRawEdgeFromComparison = (comparison: Pick<MarketComparisonOutput, 'rawDelta' | 'modelRank' | 'consensusRank'>): number =>
  scoreRawEdge(comparison.rawDelta, comparison.modelRank, comparison.consensusRank);
