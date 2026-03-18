import type { RawEvent } from '../types/rawEvent.js';
import type { NormalizedEvent } from '../types/normalizedEvent.js';
import { createNormalizedEvent } from './shared.js';

export const normalizeInjuryEvent = (rawEvent: RawEvent): NormalizedEvent => {
  const assumptions: string[] = [];
  const effectiveWeek = rawEvent.effectiveWeek ?? 1;

  if (rawEvent.severity === undefined) {
    assumptions.push('Defaulted injury severity to 6/10 because the raw event omitted severity.');
  }

  return createNormalizedEvent(
    rawEvent,
    {
      type: 'TEAMMATE_INJURY',
      description:
        rawEvent.summary ??
        `${rawEvent.relatedPlayerName} is unavailable, opening opportunity for ${rawEvent.subjectPlayerName}.`,
      effectiveWeek,
      severity: rawEvent.severity ?? 6,
      clarity: rawEvent.certainty === 'SPECULATIVE' ? 0.4 : rawEvent.certainty === 'LIKELY' ? 0.68 : 0.88,
      materiallyChangedVariables: ['routesPerGame', 'targetsPerRouteRun', 'tdPerTarget'],
    },
    assumptions,
  );
};
