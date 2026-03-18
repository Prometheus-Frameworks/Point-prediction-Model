import type { RawEvent } from '../types/rawEvent.js';
import type { NormalizedEvent } from '../types/normalizedEvent.js';
import { createNormalizedEvent } from './shared.js';

export const normalizeRookieEvent = (rawEvent: RawEvent): NormalizedEvent => {
  const assumptions: string[] = [];
  const effectiveWeek = rawEvent.effectiveWeek ?? 1;

  if (rawEvent.severity === undefined) {
    assumptions.push('Defaulted rookie-added severity to 4/10 because the raw event omitted severity.');
  }

  return createNormalizedEvent(
    rawEvent,
    {
      type: 'ROOKIE_ADDED',
      description:
        rawEvent.summary ??
        `${rawEvent.relatedPlayerName} enters the room, creating future competition for ${rawEvent.subjectPlayerName}.`,
      effectiveWeek,
      severity: rawEvent.severity ?? 4,
      clarity: rawEvent.certainty === 'SPECULATIVE' ? 0.38 : rawEvent.certainty === 'LIKELY' ? 0.62 : 0.84,
      materiallyChangedVariables: ['routesPerGame', 'targetsPerRouteRun', 'catchRate', 'yardsPerTarget', 'tdPerTarget'],
    },
    assumptions,
  );
};
