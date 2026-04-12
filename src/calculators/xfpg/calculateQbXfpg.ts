import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { clamp, roundTo, scoringSystem } from '../../core/scoringSystem.js';

export const calculateQbXfpg = (player: PlayerOpportunityInput): number => {
  const passAttempts = player.pass_attempts_pg ?? 0;
  const passYards = passAttempts * (player.pass_yards_per_attempt ?? 0);
  const passTds = passAttempts * (player.pass_td_rate ?? 0);
  const interceptions = passAttempts * (player.interception_rate ?? 0);

  const designedRushAttempts = player.designed_rush_attempts_pg ?? 0;
  const scrambleRushAttempts = player.scramble_rush_attempts_pg ?? 0;
  const fallbackRushAttempts = player.rush_attempts_pg ?? player.carries_pg ?? 0;
  const hasSplitRushInputs = player.designed_rush_attempts_pg !== undefined || player.scramble_rush_attempts_pg !== undefined;
  const rushAttempts = hasSplitRushInputs ? designedRushAttempts + scrambleRushAttempts : fallbackRushAttempts;

  const rushYards = rushAttempts * (player.rush_yards_per_attempt ?? player.yards_per_carry ?? 0);
  const designedRateBoost = clamp(designedRushAttempts * 0.004, 0, 0.05);
  const goalLineRateBoost = clamp((player.goal_line_rush_attempts_pg ?? 0) * 0.015, 0, 0.08);
  const scrambleRateBoost = clamp(scrambleRushAttempts * 0.0015, 0, 0.02);
  const adjustedRushTdRate = clamp((player.rush_td_rate ?? 0) + designedRateBoost + goalLineRateBoost + scrambleRateBoost, 0, 0.35);
  const rushTds = rushAttempts * adjustedRushTdRate;

  const points =
    passYards * scoringSystem.passingYardPoint +
    passTds * scoringSystem.passingTdPoint +
    interceptions * scoringSystem.interceptionPoint +
    rushYards * scoringSystem.rushingYardPoint +
    rushTds * scoringSystem.rushingTdPoint;

  return roundTo(points);
};
