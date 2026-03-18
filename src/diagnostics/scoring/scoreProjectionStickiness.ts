import type { ProjectionDiagnosticInput, ProjectionStickinessScore } from '../types/regressionSignal.js';
import { blend, finalizeScore, normalize } from './shared.js';

export const scoreProjectionStickiness = ({ row, prediction }: ProjectionDiagnosticInput): ProjectionStickinessScore => {
  const intervalWidth = Math.max(0, prediction.upper90 - prediction.lower90);
  const contextualInstability = blend(
    [normalize(row.event_severity, 0, 10), 0.25],
    [1 - normalize(row.event_clarity, 0.5, 1), 0.2],
    [normalize(row.event_history_count, 0, 4), 0.1],
    [normalize(row.player_recent_team_change, 0, 1), 0.15],
    [normalize(row.event_has_recent_signal, 0, 1), 0.15],
    [normalize(Math.abs(row.event_depth_chart_delta), 0, 5), 0.15],
  );

  const intervalTightness = 1 - normalize(intervalWidth, 4, 18);
  const baseStickiness = blend(
    [intervalTightness, 0.4],
    [normalize(row.player_sample_reliability, 0.2, 1), 0.2],
    [1 - normalize(row.player_usage_volatility_trailing5, 0.2, 2), 0.2],
    [1 - contextualInstability, 0.2],
  );

  const fragility = blend(
    [normalize(intervalWidth, 4, 18), 0.4],
    [contextualInstability, 0.35],
    [normalize(row.player_usage_volatility_trailing5, 0.2, 2), 0.15],
    [1 - normalize(row.player_sample_reliability, 0.2, 1), 0.1],
  );

  return {
    stickinessScore: finalizeScore(baseStickiness * 100),
    fragilityScore: finalizeScore(fragility * 100),
    intervalWidth: Number(intervalWidth.toFixed(2)),
    contextualInstability: finalizeScore(contextualInstability * 100),
  };
};
