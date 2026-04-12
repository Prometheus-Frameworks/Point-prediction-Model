import { describe, expect, it } from 'vitest';
import type { WeeklyScoringRequest } from '../src/contracts/scoring.js';
import { buildRosPlayerCardService, buildWeeklyPlayerCardService, buildWeeklyRankingsViewService } from '../src/services/scoring/buildTiberViewsService.js';

const weeklyRequest: WeeklyScoringRequest = {
  league_context: {
    teams: 12,
    starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
    replacement_buffer: 0.1,
  },
  players: [
    {
      player_id: 'elite-qb',
      player_name: 'Elite QB',
      team: 'BUF',
      position: 'QB',
      games_sampled: 17,
      pass_attempts_pg: 36,
      pass_yards_per_attempt: 8.1,
      pass_td_rate: 0.069,
      interception_rate: 0.018,
      rush_attempts_pg: 7,
      rush_yards_per_attempt: 5.6,
      rush_td_rate: 0.05,
      role_stability: 0.92,
      td_dependency: 0.24,
      injury_risk: 0.12,
    },
    {
      player_id: 'mid-wr',
      player_name: 'Mid WR',
      team: 'ATL',
      position: 'WR',
      games_sampled: 16,
      routes_pg: 34,
      targets_per_route: 0.23,
      catch_rate: 0.65,
      yards_per_target: 8.4,
      receiving_td_rate: 0.055,
      role_stability: 0.77,
      td_dependency: 0.45,
      injury_risk: 0.25,
    },
    {
      player_id: 'low-te',
      player_name: 'Low TE',
      team: 'TEN',
      position: 'TE',
      games_sampled: 14,
      routes_pg: 21,
      targets_per_route: 0.12,
      catch_rate: 0.61,
      yards_per_target: 6.8,
      receiving_td_rate: 0.02,
      role_stability: 0.38,
      td_dependency: 0.8,
      injury_risk: 0.45,
    },
  ],
};

describe('tiber scoring presentation layer', () => {
  it('builds canonical weekly player card fields for single player flows', () => {
    const result = buildWeeklyPlayerCardService({
      ...weeklyRequest,
      players: [weeklyRequest.players[0]],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.card).toMatchObject({
      player_id: 'elite-qb',
      player_name: 'Elite QB',
      team: 'BUF',
      position: 'QB',
      expected_points: expect.any(Number),
      replacement_points: expect.any(Number),
      vorp: expect.any(Number),
      floor: expect.any(Number),
      median: expect.any(Number),
      ceiling: expect.any(Number),
      confidence_band: expect.stringMatching(/LOW|MEDIUM|HIGH/),
      volatility_tag: expect.stringMatching(/STABLE|MODERATE|VOLATILE/),
      fragility_tag: expect.stringMatching(/LOW|MEDIUM|HIGH/),
      weekly_outlook: expect.any(String),
      role_summary: expect.any(String),
      value_summary: expect.any(String),
      role_notes: expect.any(Array),
      scoring_components: expect.objectContaining({
        expected_points: expect.any(Number),
        replacement_points: expect.any(Number),
        vorp: expect.any(Number),
      }),
      generated_at: expect.any(String),
      scoring_mode: 'weekly',
      view_type: 'player_card',
    });
  });

  it('builds rankings rows sorted and ranked for weekly tables', () => {
    const result = buildWeeklyRankingsViewService(weeklyRequest);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = result.data.view.rows;
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3]);

    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].expected_points).toBeGreaterThanOrEqual(rows[i].expected_points);
    }

    expect(rows[0]).toEqual(
      expect.objectContaining({
        player_id: expect.any(String),
        expected_points: expect.any(Number),
        vorp: expect.any(Number),
        confidence_band: expect.any(String),
        weekly_outlook: expect.any(String),
        value_summary: expect.any(String),
      }),
    );
  });

  it('builds ROS card with both weekly and ROS fields', () => {
    const result = buildRosPlayerCardService({
      ...weeklyRequest,
      players: [weeklyRequest.players[1]],
      remaining_weeks: 9,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.remaining_weeks).toBe(9);
    expect(result.data.card).toMatchObject({
      player_id: 'mid-wr',
      expected_points: expect.any(Number),
      vorp: expect.any(Number),
      ros_expected_points: expect.any(Number),
      ros_vorp: expect.any(Number),
      ros_summary: expect.any(String),
      role_notes: expect.any(Array),
      scoring_mode: 'ros',
      view_type: 'player_card',
    });
  });

  it('assigns sensible summary labels across high/mid/low outcomes', () => {
    const result = buildWeeklyRankingsViewService(weeklyRequest);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.data.view.rows.map((row) => [row.player_id, row]));

    expect(byId['elite-qb'].weekly_outlook).toMatch(/Elite weekly starter|Strong start/);
    expect(byId['mid-wr'].weekly_outlook).toMatch(/Strong start|Flex-worthy|Volatile dart throw/);
    expect(byId['low-te'].weekly_outlook).toMatch(/Volatile dart throw|Replacement-level/);
  });
});
