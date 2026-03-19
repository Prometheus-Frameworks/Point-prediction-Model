import { describe, expect, it } from 'vitest';
import { createApp } from '../src/api/app.js';

describe('API server', () => {
  const app = createApp();

  it('returns health status', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: 'point-prediction-model',
    });
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
