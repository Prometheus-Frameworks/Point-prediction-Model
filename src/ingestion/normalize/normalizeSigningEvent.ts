import type { RawEvent } from '../types/rawEvent.js';
import type { NormalizedEvent } from '../types/normalizedEvent.js';
import { createNormalizedEvent } from './shared.js';

export const normalizeSigningEvent = (rawEvent: RawEvent): NormalizedEvent => {
  const assumptions: string[] = [];
  const effectiveWeek = rawEvent.effectiveWeek ?? 1;

  if (rawEvent.severity === undefined) {
    assumptions.push('Defaulted signing severity to 5/10 because the raw event omitted severity.');
  }

  return createNormalizedEvent(
    rawEvent,
    {
      type: 'PLAYER_SIGNING',
      description:
        rawEvent.summary ??
        `${rawEvent.relatedPlayerName} joins ${rawEvent.subjectTeam}, increasing target competition for ${rawEvent.subjectPlayerName}.`,
      effectiveWeek,
      severity: rawEvent.severity ?? 5,
      clarity: rawEvent.certainty === 'SPECULATIVE' ? 0.45 : rawEvent.certainty === 'LIKELY' ? 0.7 : 0.9,
      materiallyChangedVariables: ['routesPerGame', 'targetsPerRouteRun', 'tdPerTarget'],
    },
    assumptions,
  );
};
