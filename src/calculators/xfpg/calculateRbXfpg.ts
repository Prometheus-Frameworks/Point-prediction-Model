import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { roundTo, scoringSystem } from '../../core/scoringSystem.js';

export const calculateRbXfpg = (player: PlayerOpportunityInput): number => {
  const carries = player.carries_pg ?? player.rush_attempts_pg ?? 0;
  const rushYards = carries * (player.yards_per_carry ?? player.rush_yards_per_attempt ?? 0);
  const rushTds = carries * (player.rush_td_rate ?? 0);

  const targets = player.targets_pg ?? (player.routes_pg ?? 0) * (player.targets_per_route ?? 0);
  const receptions = targets * (player.catch_rate ?? 0.72);
  const recYards = receptions * (player.yards_per_reception ?? 7.3);
  const recTds = targets * (player.receiving_td_rate ?? 0);

  const points =
    rushYards * scoringSystem.rushingYardPoint +
    rushTds * scoringSystem.rushingTdPoint +
    receptions * scoringSystem.receptionPoint +
    recYards * scoringSystem.receivingYardPoint +
    recTds * scoringSystem.receivingTdPoint;

  return roundTo(points);
};
