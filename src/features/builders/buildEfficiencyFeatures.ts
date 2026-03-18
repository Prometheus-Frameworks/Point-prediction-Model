import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { roundFeature } from './shared.js';

export const buildEfficiencyFeatures = (input: WrTeFeatureSourceInput): Pick<
  WrTeFeatureRow,
  | 'efficiency_catch_rate_trailing3'
  | 'efficiency_catch_rate_trailing5'
  | 'efficiency_yards_per_target_trailing3'
  | 'efficiency_yards_per_target_trailing5'
  | 'efficiency_yards_per_route_run_trailing3'
  | 'efficiency_yards_per_route_run_season'
  | 'efficiency_td_per_target_trailing5'
  | 'efficiency_adot_trailing3'
  | 'efficiency_explosive_target_rate_trailing5'
  | 'efficiency_fantasy_points_pg_trailing5'
  | 'efficiency_fantasy_points_delta_vs_baseline'
> => ({
  efficiency_catch_rate_trailing3: roundFeature(input.windows.trailing3.catchRate),
  efficiency_catch_rate_trailing5: roundFeature(input.windows.trailing5.catchRate),
  efficiency_yards_per_target_trailing3: roundFeature(input.windows.trailing3.yardsPerTarget),
  efficiency_yards_per_target_trailing5: roundFeature(input.windows.trailing5.yardsPerTarget),
  efficiency_yards_per_route_run_trailing3: roundFeature(input.windows.trailing3.yardsPerRouteRun),
  efficiency_yards_per_route_run_season: roundFeature(input.windows.seasonToDate.yardsPerRouteRun),
  efficiency_td_per_target_trailing5: roundFeature(input.windows.trailing5.touchdownsPerTarget),
  efficiency_adot_trailing3: roundFeature(input.windows.trailing3.averageDepthOfTarget),
  efficiency_explosive_target_rate_trailing5: roundFeature(input.windows.trailing5.explosiveTargetRate),
  efficiency_fantasy_points_pg_trailing5: roundFeature(input.windows.trailing5.fantasyPointsPerGame),
  efficiency_fantasy_points_delta_vs_baseline: roundFeature(
    input.windows.trailing5.fantasyPointsPerGame - input.windows.baseline.fantasyPointsPerGame,
  ),
});
