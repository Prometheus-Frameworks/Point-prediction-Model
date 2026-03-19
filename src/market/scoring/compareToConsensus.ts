import { scoreRawEdge } from './scoreRawEdge.js';
import type { ConsensusInput } from '../types/consensusInput.js';
import type { EdgeDirection, MarketComparisonOutput, MarketProjectionInput } from '../types/edgeOutput.js';

const roundToTenth = (value: number): number => Number(value.toFixed(1));

export const deriveEdgeDirection = (rawDelta: number): EdgeDirection => {
  if (rawDelta > 0.25) {
    return 'above_market';
  }

  if (rawDelta < -0.25) {
    return 'below_market';
  }

  return 'in_line';
};

export const compareToConsensus = (
  projection: MarketProjectionInput,
  consensus: ConsensusInput,
): MarketComparisonOutput => {
  const rawDelta = roundToTenth(projection.modelPoints - consensus.consensusPoints);

  return {
    ...consensus,
    modelPoints: roundToTenth(projection.modelPoints),
    modelRank: projection.modelRank,
    rawDelta,
    rawEdgeScore: scoreRawEdge(rawDelta, projection.modelRank, consensus.consensusRank),
    edgeDirection: deriveEdgeDirection(rawDelta),
  };
};
