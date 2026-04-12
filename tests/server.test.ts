import { describe, expect, it } from 'vitest';
import { createApp } from '../src/api/app.js';

describe('API server', () => {
  const app = createApp();


  it('returns a friendly API root index', async () => {
    const response = await app.request('/');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: 'tiber-fantasy-scoring-engine',
      description: 'In-season fantasy scoring kernel (xFPG, replacement, VORP, ranges, confidence).',
      endpoints: {
        health: '/health',
        scoringWeeklyPlayer: '/api/scoring/weekly/player',
        scoringWeeklyBatch: '/api/scoring/weekly/batch',
        scoringReplacement: '/api/scoring/replacement',
        scoringWeeklyRankings: '/api/scoring/weekly/rankings',
        scoringRos: '/api/scoring/ros',
        legacyScenarios: '/api/scenarios',
        legacyScenarioProjection: '/api/project/scenarios',
      },
    });
  });

  it('returns health status', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: 'tiber-fantasy-scoring-engine',
    });
  });


  it('scores weekly players through the scoring API', async () => {
    const response = await app.request('/api/scoring/weekly/batch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        league_context: {
          teams: 12,
          starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
        },
        players: [
          {
            player_id: 'qb-a',
            player_name: 'Test QB',
            team: 'DAL',
            position: 'QB',
            games_sampled: 16,
            pass_attempts_pg: 33,
            pass_yards_per_attempt: 7.4,
            pass_td_rate: 0.06,
            interception_rate: 0.02,
            rush_attempts_pg: 5,
            rush_yards_per_attempt: 5.8,
            rush_td_rate: 0.03,
          },
        ],
      }),
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.players[0]).toEqual(
      expect.objectContaining({
        expected_points: expect.any(Number),
        replacement_points: expect.any(Number),
        vorp: expect.any(Number),
      }),
    );
  });

  it('returns mock decision-board data', async () => {
    const response = await app.request('/api/decision-board/mock');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.source).toBe('sampleDecisionBoardRun');
    expect(payload.rows.length).toBeGreaterThan(0);
    expect(payload.rows[0]).toEqual(
      expect.objectContaining({
        rowId: expect.any(String),
        playerName: expect.any(String),
      }),
    );
  });

  it('returns seeded scenario metadata', async () => {
    const response = await app.request('/api/scenarios');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.count).toBeGreaterThanOrEqual(5);
    expect(payload.scenarios).toContainEqual(
      expect.objectContaining({
        id: 'waddle-to-broncos',
        eventType: expect.any(String),
      }),
    );
  });

  it('projects scenarios through the API without duplicating business logic', async () => {
    const response = await app.request('/api/project/scenarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scenarios: [
          {
            metadata: {
              id: 'api-projection-scenario',
              title: 'API projection scenario',
              description: 'Projects one seeded-style scenario through the HTTP layer.',
              tags: ['api', 'test'],
              defaultRun: false,
            },
            player: {
              id: 'api-test-player',
              name: 'API Test Player',
              position: 'WR',
              team: 'ATL',
              sampleSizeGames: 17,
              routesPerGame: 33,
              targetsPerRouteRun: 0.24,
              catchRate: 0.64,
              yardsPerTarget: 8.8,
              tdPerTarget: 0.06,
              rushPointsPerGame: 0.2,
            },
            previousTeamContext: {
              team: 'ATL',
              quarterback: 'Test QB',
              targetCompetitionIndex: 72,
              qbEfficiencyIndex: 101,
              passTdEnvironmentIndex: 102,
              playVolumeIndex: 100,
              passRateIndex: 99,
            },
            newTeamContext: {
              team: 'ATL',
              quarterback: 'Test QB',
              targetCompetitionIndex: 67,
              qbEfficiencyIndex: 102,
              passTdEnvironmentIndex: 102,
              playVolumeIndex: 101,
              passRateIndex: 100,
            },
            event: {
              type: 'TEAMMATE_INJURY',
              description: 'A teammate injury opens additional targets.',
              effectiveWeek: 1,
              severity: 6,
              clarity: 0.8,
            },
          },
        ],
      }),
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.results).toHaveLength(1);
    expect(payload.data.results[0]).toEqual(
      expect.objectContaining({
        scenarioId: 'api-projection-scenario',
      }),
    );
  });
});
