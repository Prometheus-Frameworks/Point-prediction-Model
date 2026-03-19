import type { ProjectionDiagnosticOutput } from '../../diagnostics/types/diagnosticOutput.js';
import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { FusedProjection } from '../../fusion/types/fusedProjection.js';
import type { MarketEdgeOutput } from '../../market/types/edgeOutput.js';
import type { ActionTier } from './actionTier.js';

export type DecisionDirection = 'UPSIDE' | 'DOWNSIDE' | 'NEUTRAL';

export type DecisionTag =
  | 'HIGH_CONFIDENCE_UPSIDE'
  | 'USAGE_BACKED_EDGE'
  | 'EVENT_BOOST_WITH_CAUTION'
  | 'FRAGILE_EFFICIENCY_RISK'
  | 'MARKET_DISAGREEMENT_STRONG'
  | 'WIDE_INTERVAL_LIMITATION'
  | 'STICKY_ROLE_SUPPORT'
  | 'LOW_ACTIONABILITY_NOISE';

export interface DecisionBoardInputs {
  row: WrTeFeatureRow;
  diagnostics: ProjectionDiagnosticOutput;
  fusedProjection: FusedProjection;
  marketEdge?: MarketEdgeOutput;
}

export interface DecisionBoardRow {
  rowId: string;
  scenarioId: string;
  playerId: string;
  playerName: string;
  position: WrTeFeatureRow['player_position'];
  eventType: WrTeFeatureRow['event_type'];
  fusedPointPrediction: number;
  intervalLower: number;
  intervalUpper: number;
  intervalWidth90: number;
  marketEdgeScore: number;
  regressionUpScore: number;
  regressionDownScore: number;
  stickinessScore: number;
  fragilityScore: number;
  compositeSignalScore: number;
  actionabilityScore: number;
  trustworthinessScore: number;
  actionTier: ActionTier;
  direction: DecisionDirection;
  decisionTags: DecisionTag[];
  decisionReasons: string[];
  diagnostics: ProjectionDiagnosticOutput;
  fusedProjection: FusedProjection;
  marketEdge?: MarketEdgeOutput;
}
