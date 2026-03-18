import { describe, expect, it } from 'vitest';
import { normalizeEvent } from '../src/ingestion/normalize/normalizeEvent.js';
import type { RawEvent } from '../src/ingestion/types/rawEvent.js';

const baseEvent: Omit<RawEvent, 'id' | 'eventType' | 'headline' | 'reportedAt' | 'subjectPlayerName' | 'subjectTeam'> = {
  source: 'Newswire',
  sourceEventId: 'source-1',
  summary: 'summary',
  effectiveWeek: 3,
  certainty: 'CONFIRMED',
  subjectPlayerId: 'player-1',
  subjectPosition: 'WR',
  severity: 6,
};

describe('raw event normalization', () => {
  it('normalizes trade events into PLAYER_TRADE', () => {
    const normalized = normalizeEvent({
      ...baseEvent,
      id: 'trade-1',
      eventType: 'TRADE',
      headline: 'Trade headline',
      reportedAt: '2026-03-10T12:00:00Z',
      subjectPlayerName: 'Jaylen Waddle',
      subjectTeam: 'MIA',
      fromTeam: 'MIA',
      toTeam: 'DEN',
    });

    expect(normalized.event.type).toBe('PLAYER_TRADE');
    expect(normalized.event.fromTeam?.team).toBe('MIA');
    expect(normalized.event.toTeam?.team).toBe('DEN');
  });

  it('normalizes injury events into TEAMMATE_INJURY', () => {
    const normalized = normalizeEvent({
      ...baseEvent,
      id: 'injury-1',
      eventType: 'INJURY',
      headline: 'Injury headline',
      reportedAt: '2026-03-10T12:00:00Z',
      subjectPlayerName: 'Garrett Wilson',
      subjectTeam: 'NYJ',
      relatedPlayerName: 'Davante Adams',
    });

    expect(normalized.event.type).toBe('TEAMMATE_INJURY');
    expect(normalized.relatedPlayer?.name).toBe('Davante Adams');
  });

  it('normalizes signing and rookie events into canonical event types', () => {
    const signing = normalizeEvent({
      ...baseEvent,
      id: 'signing-1',
      eventType: 'SIGNING',
      headline: 'Signing headline',
      reportedAt: '2026-03-10T12:00:00Z',
      subjectPlayerName: 'Josh Palmer',
      subjectTeam: 'LAC',
      relatedPlayerName: 'Mike Williams',
    });
    const rookie = normalizeEvent({
      ...baseEvent,
      id: 'rookie-1',
      eventType: 'ROOKIE',
      headline: 'Rookie headline',
      reportedAt: '2026-03-10T12:00:00Z',
      subjectPlayerName: 'Jake Ferguson',
      subjectTeam: 'DAL',
      subjectPosition: 'TE',
      relatedPlayerName: 'Mason Taylor',
    });

    expect(signing.event.type).toBe('PLAYER_SIGNING');
    expect(rookie.event.type).toBe('ROOKIE_ADDED');
  });
});
