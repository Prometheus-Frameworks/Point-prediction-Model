import type { ProjectionDiagnosticInput, RegressionComponentScores, RegressionDiagnosticFlag } from '../types/regressionSignal.js';
import type { CombinedRegressionScores } from '../types/regressionSignal.js';

export const buildDiagnosticFlags = (
  input: ProjectionDiagnosticInput,
  components: RegressionComponentScores,
  combined: CombinedRegressionScores,
): RegressionDiagnosticFlag[] => {
  const flags = new Set<RegressionDiagnosticFlag>();
  const { row, prediction } = input;

  if (components.usageProductionGap.direction === 'up' && components.usageProductionGap.score >= 18) {
    flags.add('REGRESSION_UP_USAGE_STRONG');
    flags.add('USAGE_AHEAD_OF_PRODUCTION');
  }

  if (components.tdRegressionRisk.upScore >= 60 && row.efficiency_td_per_target_trailing5 <= 0.05) {
    flags.add('REGRESSION_UP_TD_UNDERPERFORMING');
  }

  if (components.tdRegressionRisk.downScore >= 60 && (components.efficiencyFragility.score >= 10 || components.usageProductionGap.direction === 'down')) {
    flags.add('REGRESSION_DOWN_TD_FRAGILE');
  }

  if (components.projectionStickiness.stickinessScore >= 65 && components.volumeStability.stabilityScore >= 55) {
    flags.add('PROJECTION_STICKY_HIGH_VOLUME');
  }

  if (components.projectionStickiness.fragilityScore >= 60 && row.event_type !== 'NONE') {
    flags.add('PROJECTION_FRAGILE_EVENT_DRIVEN');
  }

  if (components.efficiencyFragility.score >= 5 && components.efficiencyFragility.direction === 'down') {
    flags.add('EFFICIENCY_AHEAD_OF_ROLE');
  }

  if (components.usageProductionGap.direction === 'down' && components.usageProductionGap.score >= 16) {
    flags.add('LOW_VOLUME_OVERPRODUCTION');
  }

  if (prediction.upper90 - prediction.lower90 >= 12) {
    flags.add('INTERVAL_WIDE_HIGH_UNCERTAINTY');
  }

  if (row.player_usage_volatility_trailing5 >= 0.22 || components.volumeStability.fragilityScore >= 45) {
    flags.add('ROLE_VOLATILITY_HIGH');
  }

  if (row.player_sample_reliability <= 0.45) {
    flags.add('SAMPLE_RELIABILITY_LOW');
  }

  if (row.player_role_growth_trailing3_vs_season >= 0.06) {
    flags.add('ROLE_TRENDING_UP');
  }

  if (combined.regressionUpScore < 15 && combined.regressionDownScore < 15 && combined.stickinessScore >= 55) {
    flags.add('PROJECTION_STICKY_HIGH_VOLUME');
  }

  return [...flags];
};
