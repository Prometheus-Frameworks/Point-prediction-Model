import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { roundTo, scoringSystem } from '../../core/scoringSystem.js';

export const calculateQbXfpg = (player: PlayerOpportunityInput): number => {
  const passAttempts = player.pass_attempts_pg ?? 0;
  const passYards = passAttempts * (player.pass_yards_per_attempt ?? 0);
  const passTds = passAttempts * (player.pass_td_rate ?? 0);
  const interceptions = passAttempts * (player.interception_rate ?? 0);

  const rushAttempts = player.rush_attempts_pg ?? player.carries_pg ?? 0;
  const rushYards = rushAttempts * (player.rush_yards_per_attempt ?? player.yards_per_carry ?? 0);
  const rushTds = rushAttempts * (player.rush_td_rate ?? 0);

  const points =
    passYards * scoringSystem.passingYardPoint +
    passTds * scoringSystem.passingTdPoint +
    interceptions * scoringSystem.interceptionPoint +
    rushYards * scoringSystem.rushingYardPoint +
    rushTds * scoringSystem.rushingTdPoint;

  return roundTo(points);
};
