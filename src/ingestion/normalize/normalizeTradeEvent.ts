import type { RawEvent } from '../types/rawEvent.js';
import type { NormalizedEvent } from '../types/normalizedEvent.js';
import { createNormalizedEvent } from './shared.js';

export const normalizeTradeEvent = (rawEvent: RawEvent): NormalizedEvent => {
  const effectiveWeek = rawEvent.effectiveWeek ?? 1;
  const assumptions: string[] = [];

  if (rawEvent.effectiveWeek === undefined) {
    assumptions.push('Defaulted effectiveWeek to 1 because the raw trade did not specify timing.');
  }

  return createNormalizedEvent(
    rawEvent,
    {
      type: 'PLAYER_TRADE',
      description:
        rawEvent.summary ??
        `${rawEvent.subjectPlayerName} is projected after a move from ${rawEvent.fromTeam} to ${rawEvent.toTeam}.`,
      effectiveWeek,
      fromTeam: {
        team: rawEvent.fromTeam as string,
        quarterback: 'Mock QB',
        targetCompetitionIndex: 80,
        qbEfficiencyIndex: 100,
        passTdEnvironmentIndex: 100,
        playVolumeIndex: 100,
        passRateIndex: 100,
      },
      toTeam: {
        team: rawEvent.toTeam as string,
        quarterback: 'Mock QB',
        targetCompetitionIndex: 78,
        qbEfficiencyIndex: 100,
        passTdEnvironmentIndex: 100,
        playVolumeIndex: 100,
        passRateIndex: 100,
      },
      severity: rawEvent.severity ?? 7,
      clarity: rawEvent.certainty === 'SPECULATIVE' ? 0.45 : rawEvent.certainty === 'LIKELY' ? 0.7 : 0.92,
      materiallyChangedVariables: [
        'routesPerGame',
        'targetsPerRouteRun',
        'catchRate',
        'yardsPerTarget',
        'tdPerTarget',
      ],
    },
    assumptions,
  );
};
