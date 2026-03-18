import type { NormalizedEvent } from '../types/normalizedEvent.js';
import type { RawEvent } from '../types/rawEvent.js';
import { normalizeInjuryEvent } from './normalizeInjuryEvent.js';
import { normalizeRookieEvent } from './normalizeRookieEvent.js';
import { normalizeSigningEvent } from './normalizeSigningEvent.js';
import { normalizeTradeEvent } from './normalizeTradeEvent.js';

export const normalizeEvent = (rawEvent: RawEvent): NormalizedEvent => {
  switch (rawEvent.eventType) {
    case 'TRADE':
      return normalizeTradeEvent(rawEvent);
    case 'INJURY':
      return normalizeInjuryEvent(rawEvent);
    case 'SIGNING':
      return normalizeSigningEvent(rawEvent);
    case 'ROOKIE':
      return normalizeRookieEvent(rawEvent);
    default: {
      const exhaustiveCheck: never = rawEvent.eventType;
      throw new Error(`Unsupported raw event type '${String(exhaustiveCheck)}'.`);
    }
  }
};

export const normalizeEvents = (rawEvents: RawEvent[]): NormalizedEvent[] => rawEvents.map(normalizeEvent);
