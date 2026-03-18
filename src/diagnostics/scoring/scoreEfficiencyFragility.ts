import type { EfficiencyFragilityScore, ProjectionDiagnosticInput } from '../types/regressionSignal.js';
import { blend, finalizeScore, normalize } from './shared.js';

export const scoreEfficiencyFragility = ({ row }: ProjectionDiagnosticInput): EfficiencyFragilityScore => {
  const efficiencyComposite = blend(
    [normalize(row.efficiency_yards_per_target_trailing3, 5.5, 11), 0.25],
    [normalize(row.efficiency_yards_per_route_run_trailing3, 0.9, 2.8), 0.25],
    [normalize(row.efficiency_catch_rate_trailing3, 0.5, 0.8), 0.15],
    [normalize(row.player_efficiency_growth_trailing3_vs_baseline, -0.15, 0.25), 0.2],
    [normalize(row.efficiency_explosive_target_rate_trailing5, 0.05, 0.25), 0.15],
  );

  const roleSupportComposite = blend(
    [normalize(row.usage_targets_pg_trailing5, 3, 10), 0.25],
    [normalize(row.usage_target_share_trailing5, 0.12, 0.32), 0.2],
    [normalize(row.usage_air_yards_share_trailing3, 0.08, 0.4), 0.15],
    [normalize(row.player_sample_reliability, 0.2, 1), 0.2],
    [1 - normalize(row.player_usage_volatility_trailing5, 0.2, 2), 0.2],
  );

  const fragilityGap = efficiencyComposite - roleSupportComposite;
  const score = finalizeScore(Math.max(0, fragilityGap) * 100);

  return {
    score,
    direction: fragilityGap > 0.05 ? 'down' : fragilityGap < -0.07 ? 'up' : 'neutral',
    efficiencyComposite: finalizeScore(efficiencyComposite * 100),
    roleSupportComposite: finalizeScore(roleSupportComposite * 100),
    fragilityGap: Number(fragilityGap.toFixed(3)),
  };
};
