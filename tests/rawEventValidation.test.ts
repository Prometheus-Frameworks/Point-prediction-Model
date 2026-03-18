import { describe, expect, it } from 'vitest';
import { validateRawEvent } from '../src/io/validateRawEvent.js';

const validRawEvent = {
  id: 'raw-1',
  source: 'Newswire',
  eventType: 'TRADE',
  headline: 'Player traded',
  reportedAt: '2026-03-10T12:00:00Z',
  subjectPlayerName: 'Jaylen Waddle',
  subjectTeam: 'MIA',
  fromTeam: 'MIA',
  toTeam: 'DEN',
};

describe('raw event validation', () => {
  it('accepts valid raw events', () => {
    expect(validateRawEvent(validRawEvent).eventType).toBe('TRADE');
  });

  it('fails clearly on invalid raw events', () => {
    expect(() =>
      validateRawEvent({
        ...validRawEvent,
        eventType: 'UNKNOWN',
        reportedAt: 'not-a-date',
        fromTeam: '',
      }),
    ).toThrowError(/eventType must be one of/);
  });
});
