import { describe, expect, it } from 'vitest';
import { buildScenarios, ingestRawEvents, projectBatch, projectFromRawEvents, projectScenario } from '../src/public/index.js';
import type { ProjectionScenario, RawEvent } from '../src/public/index.js';

const sampleRawEvents: RawEvent[] = [
  {
    id: 'service-trade-1',
    source: 'Service Wire',
    sourceEventId: 'svc-1',
    eventType: 'TRADE',
    headline: 'Jaylen Waddle traded to Denver',
    summary: 'Jaylen Waddle moves from Miami to Denver.',
    reportedAt: '2026-03-10T12:00:00Z',
    effectiveWeek: 1,
    certainty: 'CONFIRMED',
    subjectPlayerName: 'Jaylen Waddle',
    subjectPlayerId: 'jaylen-waddle',
    subjectTeam: 'MIA',
    subjectPosition: 'WR',
    fromTeam: 'MIA',
    toTeam: 'DEN',
    severity: 8,
  },
  {
    id: 'service-trade-2',
    source: 'Service Aggregator',
    sourceEventId: 'svc-2',
    eventType: 'TRADE',
    headline: 'Denver finalizes Waddle deal',
    summary: 'Duplicate confirmation of the same trade.',
    reportedAt: '2026-03-10T12:05:00Z',
    effectiveWeek: 1,
    certainty: 'CONFIRMED',
    subjectPlayerName: 'Jaylen Waddle',
    subjectTeam: 'MIA',
    subjectPosition: 'WR',
    fromTeam: 'MIA',
    toTeam: 'DEN',
    severity: 8,
  },
];

const sampleScenario: ProjectionScenario = {
  metadata: {
    id: 'service-scenario-1',
    title: 'Veteran WR navigates a new signing',
    description: 'A sample WR scenario for service-level tests.',
    tags: ['service', 'wr'],
    defaultRun: false,
  },
  player: {
    id: 'drake-london',
    name: 'Drake London',
    position: 'WR',
    team: 'ATL',
    sampleSizeGames: 17,
    routesPerGame: 35,
    targetsPerRouteRun: 0.27,
    catchRate: 0.65,
    yardsPerTarget: 8.9,
    tdPerTarget: 0.07,
    rushPointsPerGame: 0.1,
  },
  previousTeamContext: {
    team: 'ATL',
    quarterback: 'Kirk Cousins',
    targetCompetitionIndex: 72,
    qbEfficiencyIndex: 102,
    passTdEnvironmentIndex: 101,
    playVolumeIndex: 100,
    passRateIndex: 99,
  },
  newTeamContext: {
    team: 'ATL',
    quarterback: 'Kirk Cousins',
    targetCompetitionIndex: 81,
    qbEfficiencyIndex: 101,
    passTdEnvironmentIndex: 100,
    playVolumeIndex: 100,
    passRateIndex: 98,
  },
  event: {
    type: 'PLAYER_SIGNING',
    description: 'Atlanta signs another proven target earner.',
    effectiveWeek: 1,
    severity: 5,
    clarity: 0.84,
  },
};

describe('service layer', () => {
  it('ingests valid raw events in memory and returns deduplicated normalized output', () => {
    const result = ingestRawEvents(sampleRawEvents);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.rawEvents).toHaveLength(2);
    expect(result.data.normalizedEvents).toHaveLength(1);
    expect(result.data.normalizedEvents[0].event.type).toBe('PLAYER_TRADE');
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'DUPLICATE_EVENTS_REMOVED',
      }),
    ]);
  });

  it('builds scenarios from normalized events', () => {
    const ingestResult = ingestRawEvents(sampleRawEvents);
    expect(ingestResult.ok).toBe(true);
    if (!ingestResult.ok) {
      return;
    }

    const scenarioResult = buildScenarios(ingestResult.data.normalizedEvents);
    expect(scenarioResult.ok).toBe(true);
    if (!scenarioResult.ok) {
      return;
    }

    expect(scenarioResult.data.scenarios).toHaveLength(1);
    expect(scenarioResult.data.scenarios[0].event.type).toBe('PLAYER_TRADE');
    expect(scenarioResult.data.scenarios[0].newTeamContext.team).toBe('DEN');
  });

  it('projects one scenario through the service API', () => {
    const result = projectScenario(sampleScenario);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.result.scenarioId).toBe('service-scenario-1');
    expect(result.data.result.player.name).toBe('Drake London');
    expect(result.data.result.adjusted.pprPointsPerGame).toBeTypeOf('number');
  });

  it('projects many scenarios through the batch service API', () => {
    const result = projectBatch([sampleScenario, { ...sampleScenario, metadata: { ...sampleScenario.metadata, id: 'service-scenario-2' } }]);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.results).toHaveLength(2);
    expect(result.data.results.map((entry) => entry.scenarioId)).toEqual([
      'service-scenario-1',
      'service-scenario-2',
    ]);
  });

  it('runs the full raw-event-to-output pipeline', () => {
    const result = projectFromRawEvents(sampleRawEvents);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.normalizedEvents).toHaveLength(1);
    expect(result.data.scenarios).toHaveLength(1);
    expect(result.data.results).toHaveLength(1);
    expect(result.data.results[0].scenarioId).toContain('player-trade-jaylen-waddle');
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: 'DUPLICATE_EVENTS_REMOVED' }),
    ]);
  });

  it('returns structured service errors instead of throwing for invalid raw event input', () => {
    const result = projectFromRawEvents([
      {
        id: '',
        source: 'Broken source',
        eventType: 'TRADE',
        headline: 'Broken event',
        reportedAt: 'not-a-date',
        subjectPlayerName: '',
        subjectTeam: '',
        fromTeam: 'MIA',
        toTeam: 'DEN',
      } as RawEvent,
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        code: 'RAW_EVENT_VALIDATION_FAILED',
      }),
    );
    expect(result.errors[0].details).toEqual(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.stringContaining('rawEvent[0].id'),
          expect.stringContaining('rawEvent[0].reportedAt'),
        ]),
      }),
    );
  });
});
