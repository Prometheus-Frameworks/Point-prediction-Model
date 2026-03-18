import type { ProjectionDiagnosticInput, VolumeStabilityScore } from '../types/regressionSignal.js';
import { blend, finalizeScore, normalize } from './shared.js';

export const scoreVolumeStability = ({ row }: ProjectionDiagnosticInput): VolumeStabilityScore => {
  const volumeComposite = blend(
    [normalize(row.usage_routes_pg_trailing5, 18, 42), 0.25],
    [normalize(row.usage_target_share_trailing5, 0.1, 0.34), 0.25],
    [normalize(row.usage_snap_rate_trailing3, 0.45, 0.95), 0.2],
    [normalize(row.player_games_trailing5, 2, 5), 0.15],
    [normalize(row.player_sample_reliability, 0.2, 1), 0.15],
  );

  const volatilityComposite = blend(
    [normalize(row.player_usage_volatility_trailing5, 0.2, 2), 0.45],
    [normalize(Math.abs(row.usage_route_stability_delta), 0, 1.5), 0.25],
    [normalize(Math.abs(row.player_role_growth_trailing3_vs_season), 0, 0.15), 0.15],
    [1 - normalize(row.player_games_trailing5, 2, 5), 0.15],
  );

  return {
    stabilityScore: finalizeScore((volumeComposite * (1 - volatilityComposite)) * 100),
    fragilityScore: finalizeScore((volatilityComposite * (1 - volumeComposite * 0.35)) * 100),
    volumeComposite: finalizeScore(volumeComposite * 100),
    volatilityComposite: finalizeScore(volatilityComposite * 100),
  };
};
