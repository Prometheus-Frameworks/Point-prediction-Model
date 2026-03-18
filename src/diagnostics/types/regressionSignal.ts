import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';

export type RegressionDiagnosticFlag =
  | 'REGRESSION_UP_USAGE_STRONG'
  | 'REGRESSION_UP_TD_UNDERPERFORMING'
  | 'REGRESSION_DOWN_TD_FRAGILE'
  | 'PROJECTION_STICKY_HIGH_VOLUME'
  | 'PROJECTION_FRAGILE_EVENT_DRIVEN'
  | 'EFFICIENCY_AHEAD_OF_ROLE'
  | 'USAGE_AHEAD_OF_PRODUCTION'
  | 'LOW_VOLUME_OVERPRODUCTION'
  | 'INTERVAL_WIDE_HIGH_UNCERTAINTY'
  | 'ROLE_VOLATILITY_HIGH'
  | 'SAMPLE_RELIABILITY_LOW'
  | 'ROLE_TRENDING_UP';

export interface ProjectionDiagnosticInput {
  row: WrTeFeatureRow;
  prediction: WrTeBaselinePrediction;
}

export interface UsageProductionGapScore {
  score: number;
  direction: 'up' | 'down' | 'neutral';
  usageComposite: number;
  productionComposite: number;
  gap: number;
}

export interface EfficiencyFragilityScore {
  score: number;
  direction: 'up' | 'down' | 'neutral';
  efficiencyComposite: number;
  roleSupportComposite: number;
  fragilityGap: number;
}

export interface TdRegressionRiskScore {
  upScore: number;
  downScore: number;
  tdRate: number;
  redZoneShare: number;
  projectedTdPointsShare: number;
}

export interface VolumeStabilityScore {
  stabilityScore: number;
  fragilityScore: number;
  volumeComposite: number;
  volatilityComposite: number;
}

export interface ProjectionStickinessScore {
  stickinessScore: number;
  fragilityScore: number;
  intervalWidth: number;
  contextualInstability: number;
}

export interface RegressionComponentScores {
  usageProductionGap: UsageProductionGapScore;
  efficiencyFragility: EfficiencyFragilityScore;
  tdRegressionRisk: TdRegressionRiskScore;
  volumeStability: VolumeStabilityScore;
  projectionStickiness: ProjectionStickinessScore;
}

export interface CombinedRegressionScores {
  regressionUpScore: number;
  regressionDownScore: number;
  stickinessScore: number;
  fragilityScore: number;
}
