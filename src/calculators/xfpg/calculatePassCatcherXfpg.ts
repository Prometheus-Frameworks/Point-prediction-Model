import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { clamp, roundTo, scoringSystem } from '../../core/scoringSystem.js';

const defaultRoutesByPosition = {
  WR: 34,
  TE: 28,
} as const;

const resolveTargets = (player: PlayerOpportunityInput): number => {
  if (player.targets_pg !== undefined) {
    return player.targets_pg;
  }

  const targetsPerRoute = player.targets_per_route ?? 0;

  if (player.routes_pg !== undefined) {
    return player.routes_pg * targetsPerRoute;
  }

  const routeParticipation = player.route_participation ?? 0;
  const baselineRoutes = player.position === 'TE' ? defaultRoutesByPosition.TE : defaultRoutesByPosition.WR;

  return baselineRoutes * clamp(routeParticipation, 0, 1) * targetsPerRoute;
};

export const calculatePassCatcherXfpg = (player: PlayerOpportunityInput): number => {
  const targets = resolveTargets(player);

  const firstReadBonus =
    player.first_read_target_share !== undefined
      ? clamp((player.first_read_target_share - 0.2) * 0.35, -0.03, 0.07)
      : 0;
  const depthBonus =
    player.air_yards_per_target !== undefined ? clamp((player.air_yards_per_target - 8) * 0.004, -0.02, 0.04) : 0;
  const rzShareBonus =
    player.red_zone_target_share !== undefined
      ? clamp((player.red_zone_target_share - 0.2) * 0.12, -0.02, 0.04)
      : 0;
  const endZoneTargets = player.end_zone_targets_pg ?? targets * (player.red_zone_target_share ?? 0) * 0.35;
  const endZoneBonus = clamp(endZoneTargets * 0.006, 0, 0.04);
  const routeRoleBonus =
    player.route_participation !== undefined ? clamp((player.route_participation - 0.75) * 0.03, -0.015, 0.015) : 0;

  const receptions = targets * (player.catch_rate ?? 0);
  const yards = targets * (player.yards_per_target ?? 0);
  const adjustedReceivingTdRate = clamp(
    (player.receiving_td_rate ?? 0) + firstReadBonus + depthBonus + rzShareBonus + endZoneBonus + routeRoleBonus,
    0,
    0.2,
  );
  const tds = targets * adjustedReceivingTdRate;

  const rushAttempts = player.carries_pg ?? player.rush_attempts_pg ?? 0;
  const rushYards = rushAttempts * (player.yards_per_carry ?? player.rush_yards_per_attempt ?? 0);
  const rushTds = rushAttempts * (player.rush_td_rate ?? 0);

  const points =
    receptions * scoringSystem.receptionPoint +
    yards * scoringSystem.receivingYardPoint +
    tds * scoringSystem.receivingTdPoint +
    rushYards * scoringSystem.rushingYardPoint +
    rushTds * scoringSystem.rushingTdPoint;

  return roundTo(points);
};
