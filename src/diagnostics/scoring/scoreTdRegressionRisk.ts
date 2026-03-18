import type { ProjectionDiagnosticInput, TdRegressionRiskScore } from '../types/regressionSignal.js';
import { blend, finalizeScore, normalize } from './shared.js';

export const scoreTdRegressionRisk = ({ row, prediction }: ProjectionDiagnosticInput): TdRegressionRiskScore => {
  const tdRate = row.efficiency_td_per_target_trailing5;
  const redZoneShare = row.usage_red_zone_target_share_trailing5;
  const projectedTdPointsShare = prediction.predictedPpr <= 0
    ? 0
    : (Math.max(0, tdRate) * Math.max(0, row.usage_targets_pg_trailing5) * 6) / prediction.predictedPpr;

  const downScore = finalizeScore(blend(
    [normalize(tdRate, 0.03, 0.12), 0.45],
    [normalize(projectedTdPointsShare, 0.1, 0.45), 0.35],
    [1 - normalize(row.player_sample_reliability, 0.2, 1), 0.1],
    [normalize(row.player_usage_volatility_trailing5, 0.05, 0.35), 0.1],
  ) * 100);

  const upScore = finalizeScore(blend(
    [normalize(redZoneShare, 0.08, 0.35), 0.45],
    [normalize(row.usage_end_zone_target_share_season, 0.05, 0.25), 0.25],
    [1 - normalize(tdRate, 0.02, 0.08), 0.2],
    [normalize(row.usage_targets_pg_trailing5, 3, 10), 0.1],
  ) * 100);

  return {
    upScore,
    downScore,
    tdRate: Number(tdRate.toFixed(3)),
    redZoneShare: Number(redZoneShare.toFixed(3)),
    projectedTdPointsShare: Number(projectedTdPointsShare.toFixed(3)),
  };
};
