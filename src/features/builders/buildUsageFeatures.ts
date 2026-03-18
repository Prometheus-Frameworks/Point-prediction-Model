import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { roundFeature } from './shared.js';

export const buildUsageFeatures = (input: WrTeFeatureSourceInput): Pick<
  WrTeFeatureRow,
  | 'usage_routes_pg_trailing3'
  | 'usage_routes_pg_trailing5'
  | 'usage_routes_pg_season'
  | 'usage_targets_pg_trailing3'
  | 'usage_targets_pg_trailing5'
  | 'usage_targets_pg_season'
  | 'usage_tprr_trailing3'
  | 'usage_tprr_trailing5'
  | 'usage_target_share_trailing3'
  | 'usage_target_share_trailing5'
  | 'usage_target_share_season'
  | 'usage_air_yards_share_trailing3'
  | 'usage_first_read_share_trailing3'
  | 'usage_red_zone_target_share_trailing5'
  | 'usage_end_zone_target_share_season'
  | 'usage_snap_rate_trailing3'
  | 'usage_route_stability_delta'
> => ({
  usage_routes_pg_trailing3: roundFeature(input.windows.trailing3.routesPerGame),
  usage_routes_pg_trailing5: roundFeature(input.windows.trailing5.routesPerGame),
  usage_routes_pg_season: roundFeature(input.windows.seasonToDate.routesPerGame),
  usage_targets_pg_trailing3: roundFeature(input.windows.trailing3.targetsPerGame),
  usage_targets_pg_trailing5: roundFeature(input.windows.trailing5.targetsPerGame),
  usage_targets_pg_season: roundFeature(input.windows.seasonToDate.targetsPerGame),
  usage_tprr_trailing3: roundFeature(input.windows.trailing3.targetsPerRouteRun),
  usage_tprr_trailing5: roundFeature(input.windows.trailing5.targetsPerRouteRun),
  usage_target_share_trailing3: roundFeature(input.windows.trailing3.targetShare),
  usage_target_share_trailing5: roundFeature(input.windows.trailing5.targetShare),
  usage_target_share_season: roundFeature(input.windows.seasonToDate.targetShare),
  usage_air_yards_share_trailing3: roundFeature(input.windows.trailing3.airYardsShare),
  usage_first_read_share_trailing3: roundFeature(input.windows.trailing3.firstReadTargetShare),
  usage_red_zone_target_share_trailing5: roundFeature(input.windows.trailing5.redZoneTargetShare),
  usage_end_zone_target_share_season: roundFeature(input.windows.seasonToDate.endZoneTargetShare),
  usage_snap_rate_trailing3: roundFeature(input.windows.trailing3.snapRate),
  usage_route_stability_delta: roundFeature(input.windows.trailing3.routesPerGame - input.windows.trailing5.routesPerGame),
});
