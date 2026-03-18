import type { ProjectionDiagnosticInput, RegressionComponentScores } from '../types/regressionSignal.js';
import type { CombinedRegressionScores, RegressionDiagnosticFlag } from '../types/regressionSignal.js';

const pushIf = (bullets: string[], condition: boolean, bullet: string) => {
  if (condition) {
    bullets.push(bullet);
  }
};

export const buildRegressionExplanation = (
  input: ProjectionDiagnosticInput,
  components: RegressionComponentScores,
  combined: CombinedRegressionScores,
  flags: RegressionDiagnosticFlag[],
): string[] => {
  const { row, prediction } = input;
  const bullets: string[] = [];

  if (combined.regressionUpScore >= 50) {
    bullets.push(
      `${row.player_name} grades as a regression-up candidate because recent usage (${row.usage_targets_pg_trailing5.toFixed(1)} targets/game) is stronger than recent production (${row.efficiency_fantasy_points_pg_trailing5.toFixed(1)} PPR/game).`,
    );
  } else if (combined.regressionDownScore >= 40) {
    bullets.push(
      `${row.player_name} grades as a regression-down candidate because efficiency and touchdown output are running ahead of role support.`,
    );
  } else {
    bullets.push(`${row.player_name}'s projection profile is more balanced than directional, with modest regression pressure either way.`);
  }

  pushIf(
    bullets,
    flags.includes('EFFICIENCY_AHEAD_OF_ROLE'),
    `Efficiency fragility is elevated: ${row.efficiency_yards_per_route_run_trailing3.toFixed(2)} YPRR is outpacing the underlying role and sample reliability inputs.`,
  );

  pushIf(
    bullets,
    flags.includes('USAGE_AHEAD_OF_PRODUCTION'),
    `Usage is ahead of production: target share (${(row.usage_target_share_trailing5 * 100).toFixed(0)}%) and route volume remain strong relative to fantasy output.`,
  );

  pushIf(
    bullets,
    flags.includes('REGRESSION_DOWN_TD_FRAGILE'),
    `Touchdown dependence is fragile: the current ${ (row.efficiency_td_per_target_trailing5 * 100).toFixed(1)}% TD-per-target clip looks difficult to sustain.`,
  );

  pushIf(
    bullets,
    flags.includes('PROJECTION_STICKY_HIGH_VOLUME'),
    `Projection stickiness is supported by stable volume, tighter intervals, and limited contextual disruption.`,
  );

  pushIf(
    bullets,
    flags.includes('PROJECTION_FRAGILE_EVENT_DRIVEN'),
    `Projection fragility is elevated because this outlook is being driven by a recent ${row.event_type} event with meaningful context volatility.`,
  );

  pushIf(
    bullets,
    flags.includes('INTERVAL_WIDE_HIGH_UNCERTAINTY'),
    `The 90% interval spans ${(prediction.upper90 - prediction.lower90).toFixed(1)} PPR points, so downstream systems should treat the median outcome as less sticky.`,
  );

  pushIf(
    bullets,
    flags.includes('SAMPLE_RELIABILITY_LOW'),
    `Sample reliability is low (${row.player_sample_reliability.toFixed(2)}), which makes recent efficiency and role signals less trustworthy.`,
  );

  if (bullets.length < 3) {
    bullets.push(
      `Composite scores: regression up ${combined.regressionUpScore.toFixed(1)}, regression down ${combined.regressionDownScore.toFixed(1)}, stickiness ${combined.stickinessScore.toFixed(1)}, fragility ${combined.fragilityScore.toFixed(1)}.`,
    );
  }

  return bullets;
};
