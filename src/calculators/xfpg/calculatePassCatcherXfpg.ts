import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { roundTo, scoringSystem } from '../../core/scoringSystem.js';

export const calculatePassCatcherXfpg = (player: PlayerOpportunityInput): number => {
  const routes = player.routes_pg ?? 0;
  const targets = player.targets_pg ?? routes * (player.targets_per_route ?? 0);
  const receptions = targets * (player.catch_rate ?? 0);
  const yards = targets * (player.yards_per_target ?? 0);
  const tds = targets * (player.receiving_td_rate ?? 0);

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
