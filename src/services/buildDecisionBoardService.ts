import { buildDecisionReasons } from '../board/flags/buildDecisionReasons.js';
import { buildDecisionTags } from '../board/flags/buildDecisionTags.js';
import { scoreActionability } from '../board/scoring/scoreActionability.js';
import { scoreCompositeSignal } from '../board/scoring/scoreCompositeSignal.js';
import { scoreTrustworthiness } from '../board/scoring/scoreTrustworthiness.js';
import type { DecisionBoardInputs, DecisionBoardRow } from '../board/types/decisionBoardRow.js';
import type { MarketEdgeOutput } from '../market/types/edgeOutput.js';
import type { FusedProjection } from '../fusion/types/fusedProjection.js';
import { roundTo } from '../utils/math.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { BuildDecisionBoardResult } from './types.js';

export interface BuildDecisionBoardServiceInput {
  fusedProjections: FusedProjection[];
  marketEdges?: MarketEdgeOutput[];
  generatedAt?: string;
}

export interface BuildDecisionBoardOutput {
  rows: DecisionBoardRow[];
  unmatchedFusedProjectionRowIds: string[];
  unmatchedMarketEdgeRowIds: string[];
  generatedAt: string;
}

const buildDecisionBoardRow = ({ row, diagnostics, fusedProjection, marketEdge }: DecisionBoardInputs): DecisionBoardRow => {
  const trustworthiness = scoreTrustworthiness({ row, diagnostics, fusedProjection, marketEdge });
  const composite = scoreCompositeSignal({ row, diagnostics, fusedProjection, marketEdge });
  const actionability = scoreActionability({
    compositeSignalScore: composite.score,
    trustworthinessScore: trustworthiness.score,
    direction: composite.direction,
    marketEdgeScore: marketEdge?.trustAdjustedEdgeScore ?? marketEdge?.rawEdgeScore ?? 0,
    intervalWidth90: diagnostics.intervalWidth90,
  });

  const baseRow = {
    rowId: fusedProjection.rowId,
    scenarioId: fusedProjection.scenarioId,
    playerId: fusedProjection.playerId,
    playerName: fusedProjection.playerName,
    position: fusedProjection.position,
    eventType: row.event_type,
    fusedPointPrediction: roundTo(fusedProjection.fusedPointPrediction),
    intervalLower: roundTo(fusedProjection.fusedIntervals.lower90),
    intervalUpper: roundTo(fusedProjection.fusedIntervals.upper90),
    intervalWidth90: roundTo(fusedProjection.fusedIntervals.upper90 - fusedProjection.fusedIntervals.lower90),
    marketEdgeScore: roundTo(marketEdge?.trustAdjustedEdgeScore ?? marketEdge?.rawEdgeScore ?? 0),
    regressionUpScore: diagnostics.regressionUpScore,
    regressionDownScore: diagnostics.regressionDownScore,
    stickinessScore: diagnostics.stickinessScore,
    fragilityScore: diagnostics.fragilityScore,
    compositeSignalScore: composite.score,
    actionabilityScore: actionability.score,
    trustworthinessScore: trustworthiness.score,
    actionTier: actionability.tier,
    direction: composite.direction,
    diagnostics,
    fusedProjection,
    marketEdge,
  } satisfies Omit<DecisionBoardRow, 'decisionTags' | 'decisionReasons'>;

  return {
    ...baseRow,
    decisionTags: buildDecisionTags(baseRow),
    decisionReasons: buildDecisionReasons(baseRow),
  };
};

export const buildDecisionBoardService = (
  input: BuildDecisionBoardServiceInput,
): BuildDecisionBoardResult => {
  try {
    const marketEdgeByRowId = new Map((input.marketEdges ?? []).map((edge) => [edge.rowId, edge]));
    const rows = input.fusedProjections.map((fusedProjection) => buildDecisionBoardRow({
      row: fusedProjection.diagnostics.fused.row,
      diagnostics: fusedProjection.diagnostics.fused,
      fusedProjection,
      marketEdge: marketEdgeByRowId.get(fusedProjection.rowId),
    }));

    const fusedRowIds = new Set(input.fusedProjections.map((projection) => projection.rowId));
    const marketRowIds = new Set((input.marketEdges ?? []).map((edge) => edge.rowId));

    return serviceSuccess({
      rows,
      unmatchedFusedProjectionRowIds: input.fusedProjections.filter((projection) => !marketRowIds.has(projection.rowId)).map((projection) => projection.rowId),
      unmatchedMarketEdgeRowIds: (input.marketEdges ?? []).filter((edge) => !fusedRowIds.has(edge.rowId)).map((edge) => edge.rowId),
      generatedAt: input.generatedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    return serviceFailure({
      code: 'DECISION_BOARD_BUILD_FAILED',
      message: error instanceof Error ? error.message : 'Unknown decision board build error.',
    });
  }
};
