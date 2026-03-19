import type { ProjectionDiagnosticOutput } from '../../diagnostics/types/diagnosticOutput.js';
import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { CalibrationReport, SubgroupStabilityReport } from '../../models_ml/types/uncertainty.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type { ConsensusInput } from './consensusInput.js';

export type EdgeDirection = 'above_market' | 'below_market' | 'in_line';

export type MarketEdgeFlag =
  | 'EDGE_ABOVE_MARKET_STRONG'
  | 'EDGE_BELOW_MARKET_STRONG'
  | 'EDGE_WEAK_HIGH_UNCERTAINTY'
  | 'EDGE_SUPPORTED_BY_USAGE'
  | 'EDGE_UNSUPPORTED_FRAGILE_EFFICIENCY'
  | 'EDGE_EVENT_DRIVEN_CAUTION';

export interface MarketProjectionInput {
  rowId: string;
  playerId: string;
  playerName: string;
  modelPoints: number;
  modelRank?: number;
  row?: WrTeFeatureRow;
  prediction?: WrTeBaselinePrediction;
  diagnostics?: ProjectionDiagnosticOutput;
}

export interface MarketEdgeScoringContext {
  calibrationReport?: CalibrationReport;
  subgroupReport?: SubgroupStabilityReport;
}

export interface MarketComparisonOutput extends ConsensusInput {
  modelPoints: number;
  modelRank?: number;
  rawDelta: number;
  rawEdgeScore: number;
  edgeDirection: EdgeDirection;
}

export interface TrustAdjustmentBreakdown {
  intervalWidth90?: number;
  intervalWidthPenalty: number;
  fragilityPenalty: number;
  eventUncertaintyPenalty: number;
  calibrationPenalty: number;
  subgroupPenalty: number;
  totalPenalty: number;
  confidenceMultiplier: number;
  matchedSubgroups: string[];
}

export interface MarketEdgeOutput extends MarketComparisonOutput {
  trustAdjustedEdgeScore: number;
  flags: MarketEdgeFlag[];
  explanation: string[];
  trustAdjustment: TrustAdjustmentBreakdown;
}

export interface CompareProjectionToConsensusOutput {
  comparisons: MarketComparisonOutput[];
  unmatchedProjectionRowIds: string[];
  unmatchedConsensusRowIds: string[];
}

export interface ScoreMarketEdgesOutput {
  edges: MarketEdgeOutput[];
  unmatchedProjectionRowIds: string[];
  unmatchedConsensusRowIds: string[];
  generatedAt: string;
}
