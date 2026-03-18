import type { ProjectionDiagnosticInput, UsageProductionGapScore } from '../types/regressionSignal.js';
import { blend, finalizeScore, normalize } from './shared.js';

export const scoreUsageProductionGap = ({ row, prediction }: ProjectionDiagnosticInput): UsageProductionGapScore => {
  const usageComposite = blend(
    [normalize(row.usage_targets_pg_trailing5, 3, 11), 0.3],
    [normalize(row.usage_target_share_trailing5, 0.12, 0.35), 0.25],
    [normalize(row.usage_routes_pg_trailing5, 18, 42), 0.2],
    [normalize(row.usage_tprr_trailing5, 0.12, 0.32), 0.15],
    [normalize(row.player_role_growth_trailing3_vs_season, -0.1, 0.15), 0.1],
  );

  const productionComposite = blend(
    [normalize(row.efficiency_fantasy_points_pg_trailing5, 5, 24), 0.5],
    [normalize(row.efficiency_fantasy_points_delta_vs_baseline, -6, 6), 0.2],
    [normalize(prediction.predictedPpr, 5, 24), 0.2],
    [normalize(row.player_efficiency_growth_trailing3_vs_baseline, -0.2, 0.25), 0.1],
  );

  const gap = usageComposite - productionComposite;
  const score = finalizeScore(Math.abs(gap) * 100);

  return {
    score,
    direction: gap > 0.08 ? 'up' : gap < -0.08 ? 'down' : 'neutral',
    usageComposite: finalizeScore(usageComposite * 100),
    productionComposite: finalizeScore(productionComposite * 100),
    gap: Number(gap.toFixed(3)),
  };
};
