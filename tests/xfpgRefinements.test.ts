import { describe, expect, it } from 'vitest';
import { buildDefaultReplacementPoints } from '../src/calculators/replacement/buildDefaultReplacementPoints.js';
import { calculatePassCatcherXfpg } from '../src/calculators/xfpg/calculatePassCatcherXfpg.js';
import { calculateQbXfpg } from '../src/calculators/xfpg/calculateQbXfpg.js';
import { calculateRbXfpg } from '../src/calculators/xfpg/calculateRbXfpg.js';
import type { PlayerOpportunityInput } from '../src/contracts/scoring.js';

const baseWr: PlayerOpportunityInput = {
  player_id: 'wr-a',
  player_name: 'WR A',
  team: 'AAA',
  position: 'WR',
  games_sampled: 8,
  routes_pg: 35,
  targets_per_route: 0.22,
  catch_rate: 0.65,
  yards_per_target: 8.8,
  receiving_td_rate: 0.05,
};

describe('xfpg refinements', () => {
  it('rewards higher-value WR/TE target profiles with richer inputs', () => {
    const shallowCompiler = calculatePassCatcherXfpg({
      ...baseWr,
      player_id: 'wr-shallow',
      first_read_target_share: 0.19,
      air_yards_per_target: 7.2,
      red_zone_target_share: 0.12,
      end_zone_targets_pg: 0.1,
    });

    const highValueEarner = calculatePassCatcherXfpg({
      ...baseWr,
      player_id: 'wr-valuable',
      first_read_target_share: 0.34,
      air_yards_per_target: 12.4,
      red_zone_target_share: 0.28,
      end_zone_targets_pg: 1.1,
    });

    expect(highValueEarner).toBeGreaterThan(shallowCompiler);
  });

  it('does not double-count route suppression when routes_pg is already provided', () => {
    const withRouteShare = calculatePassCatcherXfpg({
      ...baseWr,
      route_participation: 0.7,
    });

    const withoutRouteShare = calculatePassCatcherXfpg(baseWr);

    expect(Math.abs(withRouteShare - withoutRouteShare)).toBeLessThan(1.5);
  });

  it('distinguishes receiving-insulated RBs from touchdown-dependent grinders', () => {
    const tdGrinder = calculateRbXfpg({
      player_id: 'rb-grinder',
      player_name: 'RB Grinder',
      team: 'BBB',
      position: 'RB',
      games_sampled: 9,
      carries_pg: 17,
      inside_10_carries_pg: 4.2,
      rush_td_rate: 0.055,
      rush_td_opportunity: 0.78,
      yards_per_carry: 4.2,
      targets_pg: 1.8,
      catch_rate: 0.66,
      yards_per_reception: 6.4,
      receiving_td_rate: 0.01,
      receiving_role_strength: 0.22,
    });

    const receivingInsulated = calculateRbXfpg({
      player_id: 'rb-insulated',
      player_name: 'RB Insulated',
      team: 'BBB',
      position: 'RB',
      games_sampled: 9,
      carries_pg: 14,
      inside_10_carries_pg: 1.2,
      rush_td_rate: 0.03,
      rush_td_opportunity: 0.5,
      yards_per_carry: 4.5,
      targets_pg: 6.4,
      catch_rate: 0.8,
      yards_per_reception: 7.8,
      receiving_td_rate: 0.03,
      receiving_role_strength: 0.86,
    });

    expect(receivingInsulated).toBeGreaterThan(tdGrinder);
  });

  it('boosts rushing QBs for designed and goal-line rushing opportunity', () => {
    const pocketQb = calculateQbXfpg({
      player_id: 'qb-pocket',
      player_name: 'Pocket QB',
      team: 'CCC',
      position: 'QB',
      games_sampled: 10,
      pass_attempts_pg: 35,
      pass_yards_per_attempt: 7.3,
      pass_td_rate: 0.055,
      interception_rate: 0.024,
      rush_attempts_pg: 4,
      rush_yards_per_attempt: 4.8,
      rush_td_rate: 0.02,
    });

    const rushingQb = calculateQbXfpg({
      player_id: 'qb-rush',
      player_name: 'Rushing QB',
      team: 'CCC',
      position: 'QB',
      games_sampled: 10,
      pass_attempts_pg: 35,
      pass_yards_per_attempt: 7.3,
      pass_td_rate: 0.055,
      interception_rate: 0.024,
      designed_rush_attempts_pg: 5,
      scramble_rush_attempts_pg: 2,
      goal_line_rush_attempts_pg: 0.9,
      rush_yards_per_attempt: 5.3,
      rush_td_rate: 0.02,
    });

    expect(rushingQb).toBeGreaterThan(pocketQb);
  });

  it('honors explicit zero split rushing attempts instead of falling back to legacy rush totals', () => {
    const splitZeros = calculateQbXfpg({
      player_id: 'qb-zero-splits',
      player_name: 'Zero Splits QB',
      team: 'CCC',
      position: 'QB',
      games_sampled: 10,
      pass_attempts_pg: 35,
      pass_yards_per_attempt: 7.3,
      pass_td_rate: 0.055,
      interception_rate: 0.024,
      designed_rush_attempts_pg: 0,
      scramble_rush_attempts_pg: 0,
      rush_attempts_pg: 5,
      rush_yards_per_attempt: 5,
      rush_td_rate: 0.04,
    });

    const legacyRushOnly = calculateQbXfpg({
      player_id: 'qb-legacy-rush',
      player_name: 'Legacy Rush QB',
      team: 'CCC',
      position: 'QB',
      games_sampled: 10,
      pass_attempts_pg: 35,
      pass_yards_per_attempt: 7.3,
      pass_td_rate: 0.055,
      interception_rate: 0.024,
      rush_attempts_pg: 5,
      rush_yards_per_attempt: 5,
      rush_td_rate: 0.04,
    });

    expect(splitZeros).toBeLessThan(legacyRushOnly);
  });

  it('keeps backward-compatible behavior with lean legacy-style inputs', () => {
    const leanWr = calculatePassCatcherXfpg({
      ...baseWr,
      targets_pg: 8,
    });

    const leanRb = calculateRbXfpg({
      player_id: 'rb-legacy',
      player_name: 'RB Legacy',
      team: 'DDD',
      position: 'RB',
      games_sampled: 8,
      carries_pg: 15,
      yards_per_carry: 4.4,
      rush_td_rate: 0.038,
      targets_pg: 3,
      catch_rate: 0.75,
      yards_per_reception: 7.1,
      receiving_td_rate: 0.02,
    });

    const leanQb = calculateQbXfpg({
      player_id: 'qb-legacy',
      player_name: 'QB Legacy',
      team: 'EEE',
      position: 'QB',
      games_sampled: 8,
      pass_attempts_pg: 32,
      pass_yards_per_attempt: 7.1,
      pass_td_rate: 0.051,
      interception_rate: 0.026,
      rush_attempts_pg: 3,
      rush_yards_per_attempt: 4.2,
      rush_td_rate: 0.02,
    });

    expect(leanWr).toBeGreaterThan(0);
    expect(leanRb).toBeGreaterThan(0);
    expect(leanQb).toBeGreaterThan(0);
  });

  it('adjusts replacement defaults for lineup texture and flex allocation', () => {
    const wrHeavy = buildDefaultReplacementPoints({
      teams: 12,
      starters: { QB: 1, RB: 1, WR: 3, TE: 1, FLEX: 1 },
      flex_allocation: { WR: 0.7, RB: 0.2, TE: 0.1 },
    });

    const rbHeavy = buildDefaultReplacementPoints({
      teams: 12,
      starters: { QB: 1, RB: 3, WR: 2, TE: 1, FLEX: 1 },
      flex_allocation: { WR: 0.2, RB: 0.7, TE: 0.1 },
    });

    expect(wrHeavy.WR).toBeLessThan(rbHeavy.WR);
    expect(rbHeavy.RB).toBeLessThan(wrHeavy.RB);
  });

  it('normalizes partial flex allocation inputs before applying demand', () => {
    const partial = buildDefaultReplacementPoints({
      teams: 12,
      starters: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
      flex_allocation: { WR: 1 },
    });

    const explicitEquivalent = buildDefaultReplacementPoints({
      teams: 12,
      starters: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
      flex_allocation: { WR: 0.6667, RB: 0.2333, TE: 0.1 },
    });

    expect(partial.WR).toBe(explicitEquivalent.WR);
    expect(partial.RB).toBe(explicitEquivalent.RB);
    expect(partial.TE).toBe(explicitEquivalent.TE);
  });

  it('applies zero-valued opportunity shares as explicit penalties, not missing fields', () => {
    const zeroShares = calculatePassCatcherXfpg({
      ...baseWr,
      first_read_target_share: 0,
      air_yards_per_target: 0,
      red_zone_target_share: 0,
      end_zone_targets_pg: 0,
    });

    const undefinedShares = calculatePassCatcherXfpg({
      ...baseWr,
    });

    expect(zeroShares).toBeLessThan(undefinedShares);
  });
});
