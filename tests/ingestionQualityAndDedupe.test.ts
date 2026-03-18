import { describe, expect, it } from 'vitest';
import { normalizeEvents } from '../src/ingestion/normalize/normalizeEvent.js';
import { dedupeEvents } from '../src/ingestion/quality/dedupeEvents.js';
import { scoreEventQuality } from '../src/ingestion/quality/scoreEventQuality.js';
import type { RawEvent } from '../src/ingestion/types/rawEvent.js';

const highQualityTrade: RawEvent = {
  id: 'raw-trade-1',
  source: 'Newswire Alpha',
  sourceEventId: 'alpha-1001',
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
  notes: 'Deal complete',
};

const lowQualityRookie: RawEvent = {
  id: 'raw-rookie-1',
  source: 'Mock Draft Blog',
  eventType: 'ROOKIE',
  headline: 'Dallas could add a rookie TE',
  reportedAt: '2026-03-13T18:00:00Z',
  certainty: 'SPECULATIVE',
  subjectPlayerName: 'Jake Ferguson',
  subjectTeam: 'DAL',
  subjectPosition: 'TE',
  relatedPlayerName: 'Mason Taylor',
};

describe('ingestion quality scoring and dedupe', () => {
  it('assigns higher quality to complete and certain raw events', () => {
    const high = scoreEventQuality(highQualityTrade);
    const low = scoreEventQuality(lowQualityRookie);

    expect(high.qualityLabel).toBe('HIGH');
    expect(low.qualityLabel).toBe('LOW');
    expect(high.qualityScore).toBeGreaterThan(low.qualityScore);
  });

  it('dedupes near-identical normalized events from different sources', () => {
    const duplicateTrade: RawEvent = {
      ...highQualityTrade,
      id: 'raw-trade-duplicate',
      source: 'Aggregator Gamma',
      sourceEventId: 'gamma-9',
      subjectPlayerId: undefined,
      notes: undefined,
      reportedAt: '2026-03-10T12:05:00Z',
    };

    const deduped = dedupeEvents(normalizeEvents([highQualityTrade, duplicateTrade]));

    expect(deduped).toHaveLength(1);
    expect(deduped[0].sourceCount).toBe(2);
    expect(deduped[0].sourceIds).toEqual(['raw-trade-1', 'raw-trade-duplicate']);
  });
});
