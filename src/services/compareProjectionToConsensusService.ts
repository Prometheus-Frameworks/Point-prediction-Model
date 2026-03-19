import { compareToConsensus } from '../market/scoring/compareToConsensus.js';
import type { ConsensusInput } from '../market/types/consensusInput.js';
import type { CompareProjectionToConsensusOutput, MarketProjectionInput } from '../market/types/edgeOutput.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { CompareProjectionToConsensusResult } from './types.js';

export const compareProjectionToConsensusService = (
  projections: MarketProjectionInput[],
  consensusInputs: ConsensusInput[],
): CompareProjectionToConsensusResult => {
  try {
    const consensusByRowId = new Map(consensusInputs.map((input) => [input.rowId, input]));
    const matchedComparisons = projections
      .filter((projection) => consensusByRowId.has(projection.rowId))
      .map((projection) => compareToConsensus(projection, consensusByRowId.get(projection.rowId)!));

    const projectionRowIds = new Set(projections.map((projection) => projection.rowId));
    const consensusRowIds = new Set(consensusInputs.map((input) => input.rowId));

    const envelope: CompareProjectionToConsensusOutput = {
      comparisons: matchedComparisons,
      unmatchedProjectionRowIds: projections.filter((projection) => !consensusRowIds.has(projection.rowId)).map((projection) => projection.rowId),
      unmatchedConsensusRowIds: consensusInputs.filter((input) => !projectionRowIds.has(input.rowId)).map((input) => input.rowId),
    };

    return serviceSuccess(envelope);
  } catch (error) {
    return serviceFailure({
      code: 'MARKET_COMPARISON_FAILED',
      message: error instanceof Error ? error.message : 'Unknown market comparison error.',
    });
  }
};
