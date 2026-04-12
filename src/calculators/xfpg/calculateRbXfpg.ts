import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { clamp, roundTo, scoringSystem } from '../../core/scoringSystem.js';

export const calculateRbXfpg = (player: PlayerOpportunityInput): number => {
  const carries = player.carries_pg ?? player.rush_attempts_pg ?? 0;
  const baseRushTdRate = player.rush_td_rate ?? 0;
  const goalLineCarries = player.inside_10_carries_pg ?? 0;
  const rushTdOpportunityBoost = player.rush_td_opportunity ? clamp((player.rush_td_opportunity - 0.5) * 0.03, -0.01, 0.02) : 0;
  const goalLineBoost = clamp(goalLineCarries * 0.004, 0, 0.03);
  const adjustedRushTdRate = clamp(baseRushTdRate + rushTdOpportunityBoost + goalLineBoost, 0, 0.2);

  const rushYards = carries * (player.yards_per_carry ?? player.rush_yards_per_attempt ?? 0);
  const rushTds = carries * adjustedRushTdRate;

  const routeParticipation = clamp(player.route_participation ?? 1, 0.3, 1);
  const targets = player.targets_pg ?? (player.routes_pg ?? 0) * routeParticipation * (player.targets_per_route ?? 0);
  const receivingRoleStrength = player.receiving_role_strength ?? clamp(targets / 7, 0, 1);
  const receptions = targets * (player.catch_rate ?? 0.72);
  const recYards = receptions * (player.yards_per_reception ?? 7.3);
  const recTdRateBoost = clamp((receivingRoleStrength - 0.45) * 0.03, -0.01, 0.02);
  const recTds = targets * clamp((player.receiving_td_rate ?? 0) + recTdRateBoost, 0, 0.15);

  const touchdownFragilityPenalty = clamp(goalLineCarries * (1 - receivingRoleStrength) * 0.18, 0, 1.4);

  const points =
    rushYards * scoringSystem.rushingYardPoint +
    rushTds * scoringSystem.rushingTdPoint +
    receptions * scoringSystem.receptionPoint +
    recYards * scoringSystem.receivingYardPoint +
    recTds * scoringSystem.receivingTdPoint -
    touchdownFragilityPenalty;

  return roundTo(points);
};
