import { buildEdgeExplanation } from '../market/flags/buildEdgeExplanation.js';
import { buildEdgeFlags } from '../market/flags/buildEdgeFlags.js';
import { compareToConsensus } from '../market/scoring/compareToConsensus.js';
import { scoreTrustAdjustedEdge } from '../market/scoring/scoreTrustAdjustedEdge.js';
import type { ConsensusInput } from '../market/types/consensusInput.js';
import type { MarketEdgeOutput, MarketEdgeScoringContext, MarketProjectionInput, ScoreMarketEdgesOutput } from '../market/types/edgeOutput.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { ScoreMarketEdgesResult } from './types.js';

export interface ScoreMarketEdgesOptions extends MarketEdgeScoringContext {
  generatedAt?: string;
}

export const scoreMarketEdgesService = (
  projections: MarketProjectionInput[],
  consensusInputs: ConsensusInput[],
  options: ScoreMarketEdgesOptions = {},
): ScoreMarketEdgesResult => {
  try {
    const consensusByRowId = new Map(consensusInputs.map((input) => [input.rowId, input]));
    const edges: MarketEdgeOutput[] = projections
      .filter((projection) => consensusByRowId.has(projection.rowId))
      .map((projection) => {
        const comparison = compareToConsensus(projection, consensusByRowId.get(projection.rowId)!);
        const trust = scoreTrustAdjustedEdge(comparison, projection, options);
        const edge: MarketEdgeOutput = {
          ...comparison,
          ...trust,
          flags: [],
          explanation: [],
        };

        edge.flags = buildEdgeFlags(edge, projection);
        edge.explanation = buildEdgeExplanation(edge, projection);

        return edge;
      });

    const projectionRowIds = new Set(projections.map((projection) => projection.rowId));
    const consensusRowIds = new Set(consensusInputs.map((input) => input.rowId));

    const envelope: ScoreMarketEdgesOutput = {
      edges,
      unmatchedProjectionRowIds: projections.filter((projection) => !consensusRowIds.has(projection.rowId)).map((projection) => projection.rowId),
      unmatchedConsensusRowIds: consensusInputs.filter((input) => !projectionRowIds.has(input.rowId)).map((input) => input.rowId),
      generatedAt: options.generatedAt ?? new Date().toISOString(),
    };

    return serviceSuccess(envelope);
  } catch (error) {
    return serviceFailure({
      code: 'MARKET_EDGE_SCORING_FAILED',
      message: error instanceof Error ? error.message : 'Unknown market edge scoring error.',
    });
  }
};
