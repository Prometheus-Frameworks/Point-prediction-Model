import { describe, expect, it, vi } from 'vitest';
import { createScoringServiceClient } from '../src/integration/scoringServiceClient.js';
import { loadWeeklyPlayerPageScoring, loadWeeklyRankingsScoring } from '../src/integration/tiberScoringFlows.js';
import { toLeagueContextInput, toScoringPlayerInput } from '../src/integration/scoringRequestMappers.js';
import type { TiberLeagueSettings, TiberPlayerSnapshot } from '../src/integration/scoringServiceTypes.js';

const league: TiberLeagueSettings = {
  teams: 12,
  starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
  replacementBuffer: 0.1,
};

const qb: TiberPlayerSnapshot = {
  id: 'qb-1',
  name: 'Quarterback One',
  team: 'BUF',
  position: 'QB',
  gamesSampled: 17,
  passing: {
    attemptsPerGame: 35,
    yardsPerAttempt: 7.8,
    tdRate: 0.063,
    interceptionRate: 0.021,
  },
  rushing: {
    attemptsPerGame: 6,
    yardsPerAttempt: 5.5,
    tdRate: 0.03,
  },
  risk: {
    roleStability: 0.9,
    tdDependency: 0.2,
    injuryRisk: 0.1,
  },
};

const wr: TiberPlayerSnapshot = {
  id: 'wr-1',
  name: 'Wide Receiver One',
  team: 'MIA',
  position: 'WR',
  gamesSampled: 16,
  receiving: {
    routesPerGame: 34,
    targetsPerRoute: 0.24,
    catchRate: 0.66,
    yardsPerTarget: 8.7,
    tdRate: 0.06,
  },
};

describe('scoring service integration client', () => {
  it('maps tiber entities into scoring request payloads', () => {
    const leagueInput = toLeagueContextInput(league);
    const qbInput = toScoringPlayerInput(qb);
    const wrInput = toScoringPlayerInput(wr);

    expect(leagueInput.replacement_buffer).toBe(0.1);
    expect(qbInput).toEqual(
      expect.objectContaining({
        player_id: 'qb-1',
        pass_attempts_pg: 35,
        rush_attempts_pg: 6,
      }),
    );
    expect(wrInput).toEqual(
      expect.objectContaining({
        player_id: 'wr-1',
        routes_pg: 34,
        targets_per_route: 0.24,
      }),
    );
  });

  it('handles weekly player-card requests and malformed payloads', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, data: { card: { player_id: 'qb-1', expected_points: 24.3, vorp: 8.2 } } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, data: { card: { player_id: 'qb-1' } } }),
          { status: 200 },
        ),
      );

    const client = createScoringServiceClient({ baseUrl: 'http://scoring.local', fetchImpl });
    const good = await client.getWeeklyPlayerCard({
      league_context: toLeagueContextInput(league),
      players: [toScoringPlayerInput(qb)],
    });
    expect(good.ok).toBe(true);

    const malformed = await client.getWeeklyPlayerCard({
      league_context: toLeagueContextInput(league),
      players: [toScoringPlayerInput(qb)],
    });
    expect(malformed).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'invalid_payload',
      }),
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://scoring.local/api/tiber/weekly/player-card',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('handles missing base url, non-200 responses, and network failures', async () => {
    const missing = createScoringServiceClient({ baseUrl: '' });
    const missingResult = await missing.getWeeklyRankings({
      league_context: toLeagueContextInput(league),
      players: [toScoringPlayerInput(qb)],
    });
    expect(missingResult).toEqual(expect.objectContaining({ ok: false, reason: 'missing_base_url' }));

    const httpClient = createScoringServiceClient({
      baseUrl: 'http://scoring.local',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response('bad gateway', { status: 502 })),
    });
    const httpResult = await httpClient.getWeeklyRankings({
      league_context: toLeagueContextInput(league),
      players: [toScoringPlayerInput(qb)],
    });
    expect(httpResult).toEqual(expect.objectContaining({ ok: false, reason: 'http_error', status: 502 }));

    const downClient = createScoringServiceClient({
      baseUrl: 'http://scoring.local',
      fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(new Error('ECONNREFUSED')),
    });
    const downResult = await downClient.getWeeklyCompare({
      league_context: toLeagueContextInput(league),
      player_a: toScoringPlayerInput(qb),
      player_b: toScoringPlayerInput(wr),
    });
    expect(downResult).toEqual(expect.objectContaining({ ok: false, reason: 'network_error' }));
  });

  it('loads weekly player page scoring and gracefully degrades on ROS failure', async () => {
    const client = {
      getWeeklyPlayerCard: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          player_id: 'qb-1',
          player_name: 'Quarterback One',
          team: 'BUF',
          position: 'QB',
          expected_points: 25,
          vorp: 8,
          floor: 17,
          median: 24,
          ceiling: 32,
          confidence_band: 'HIGH',
          volatility_tag: 'STABLE',
          fragility_tag: 'LOW',
          weekly_outlook: 'Strong start',
          role_summary: 'Locked in starter',
          value_summary: 'High value',
          role_notes: ['Feature role'],
        },
      }),
      getRosPlayerCard: vi.fn().mockResolvedValue({ ok: false, reason: 'http_error', message: 'down', status: 503 }),
      getWeeklyRankings: vi.fn(),
      getWeeklyCompare: vi.fn(),
    };

    const state = await loadWeeklyPlayerPageScoring({ player: qb, league, includeRos: true }, client as never);
    expect(state.available).toBe(true);
    if (!state.available) return;
    expect(state.weekly.expected_points).toBe(25);
    expect(state.ros).toBeUndefined();
  });

  it('loads rankings flow and returns unavailable fallback when service is down', async () => {
    const okClient = {
      getWeeklyRankings: vi.fn().mockResolvedValue({
        ok: true,
        data: [
          {
            rank: 1,
            player_id: 'qb-1',
            player_name: 'Quarterback One',
            team: 'BUF',
            position: 'QB',
            expected_points: 25,
            vorp: 8,
            floor: 17,
            ceiling: 32,
            confidence_band: 'HIGH',
            weekly_outlook: 'Strong start',
          },
        ],
      }),
      getWeeklyPlayerCard: vi.fn(),
      getRosPlayerCard: vi.fn(),
      getWeeklyCompare: vi.fn(),
    };

    const okState = await loadWeeklyRankingsScoring({ players: [qb, wr], league }, okClient as never);
    expect(okState.available).toBe(true);
    expect(okState.rows).toHaveLength(1);

    const downClient = {
      ...okClient,
      getWeeklyRankings: vi.fn().mockResolvedValue({ ok: false, reason: 'network_error', message: 'timeout' }),
    };

    const downState = await loadWeeklyRankingsScoring({ players: [qb, wr], league }, downClient as never);
    expect(downState.available).toBe(false);
    expect(downState.rows).toHaveLength(0);
    expect(downState.message).toContain('unavailable');
  });
});
