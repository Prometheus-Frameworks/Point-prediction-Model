import { describe, expect, it } from 'vitest';
import { scoreRosService } from '../src/services/scoring/scoreRosService.js';
import { scoreWeeklyBatchService } from '../src/services/scoring/scoreWeeklyBatchService.js';
import { generateReplacementBaselinesService } from '../src/services/scoring/generateReplacementBaselinesService.js';
import type { WeeklyScoringRequest } from '../src/contracts/scoring.js';

const request: WeeklyScoringRequest = {
  league_context: {
    teams: 12,
    starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
    replacement_buffer: 0.1,
  },
  players: [
    {
      player_id: 'qb-1',
      player_name: 'Dual Threat QB',
      team: 'BUF',
      position: 'QB',
      games_sampled: 17,
      pass_attempts_pg: 34,
      pass_yards_per_attempt: 7.6,
      pass_td_rate: 0.062,
      interception_rate: 0.022,
      rush_attempts_pg: 7,
      rush_yards_per_attempt: 5.5,
      rush_td_rate: 0.04,
      role_stability: 0.9,
      td_dependency: 0.3,
      injury_risk: 0.2,
    },
    {
      player_id: 'wr-1',
      player_name: 'Alpha WR',
      team: 'MIN',
      position: 'WR',
      games_sampled: 14,
      routes_pg: 36,
      targets_per_route: 0.28,
      catch_rate: 0.66,
      yards_per_target: 9.4,
      receiving_td_rate: 0.07,
      role_stability: 0.8,
      td_dependency: 0.44,
      injury_risk: 0.25,
    },
    {
      player_id: 'rb-1',
      player_name: 'Everydown RB',
      team: 'DET',
      position: 'RB',
      games_sampled: 16,
      carries_pg: 17,
      yards_per_carry: 4.6,
      rush_td_rate: 0.04,
      targets_pg: 5.1,
      catch_rate: 0.79,
      yards_per_reception: 7.8,
      receiving_td_rate: 0.04,
      role_stability: 0.83,
      td_dependency: 0.37,
      injury_risk: 0.3,
    },
    {
      player_id: 'te-1',
      player_name: 'Volume TE',
      team: 'KC',
      position: 'TE',
      games_sampled: 15,
      routes_pg: 31,
      targets_per_route: 0.25,
      catch_rate: 0.74,
      yards_per_target: 8.1,
      receiving_td_rate: 0.06,
      role_stability: 0.85,
      td_dependency: 0.33,
      injury_risk: 0.19,
    },
  ],
};

describe('scoring kernel services', () => {
  it('produces canonical weekly scoring outputs', () => {
    const result = scoreWeeklyBatchService(request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.players.length).toBe(4);
    expect(result.data.players[0]).toMatchObject({
      expected_points: expect.any(Number),
      replacement_points: expect.any(Number),
      vorp: expect.any(Number),
      floor: expect.any(Number),
      median: expect.any(Number),
      ceiling: expect.any(Number),
      confidence_band: expect.stringMatching(/LOW|MEDIUM|HIGH/),
      volatility_tag: expect.stringMatching(/STABLE|MODERATE|VOLATILE/),
      fragility_tag: expect.stringMatching(/LOW|MEDIUM|HIGH/),
    });
  });

  it('calculates replacement baselines by position', () => {
    const result = generateReplacementBaselinesService(request.players, request.league_context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.baselines.QB.position).toBe('QB');
    expect(result.data.baselines.RB.replacement_points).toBeTypeOf('number');
    expect(result.data.baselines.WR.replacement_rank).toBeGreaterThan(0);
  });

  it('supports ROS scoring outputs', () => {
    const result = scoreRosService({
      players: request.players,
      league_context: request.league_context,
      remaining_weeks: 8,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.players[0].ros_expected_points).toBeTypeOf('number');
    expect(result.data.remaining_weeks).toBe(8);
  });
});
