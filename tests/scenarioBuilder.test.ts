import { describe, expect, it } from 'vitest';
import { buildScenarioFromEvent } from '../src/ingestion/build/buildScenarioFromEvent.js';
import { normalizeEvent } from '../src/ingestion/normalize/normalizeEvent.js';

describe('buildScenarioFromEvent', () => {
  it('converts a normalized trade event into a runnable ProjectionScenario', () => {
    const normalized = normalizeEvent({
      id: 'trade-1',
      source: 'Newswire',
      eventType: 'TRADE',
      headline: 'Trade headline',
      summary: 'Jaylen Waddle heads to Denver.',
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
    });

    const scenario = buildScenarioFromEvent(normalized);

    expect(scenario.metadata.id).toContain('player-trade');
    expect(scenario.player.name).toBe('Jaylen Waddle');
    expect(scenario.previousTeamContext.team).toBe('MIA');
    expect(scenario.newTeamContext.team).toBe('DEN');
    expect(scenario.event.type).toBe('PLAYER_TRADE');
  });
});
