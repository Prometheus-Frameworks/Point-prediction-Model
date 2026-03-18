import type { ProjectionEvent, ProjectionEventType } from '../../types/event.js';
import type { NormalizedEvent } from '../types/normalizedEvent.js';
import type { RawEvent } from '../types/rawEvent.js';
import { scoreEventQuality } from '../quality/scoreEventQuality.js';

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const buildDedupeKey = (
  type: ProjectionEventType,
  subjectPlayerName: string,
  team: string,
  relatedPlayerName?: string,
  fromTeam?: string,
  toTeam?: string,
  effectiveWeek?: number,
) =>
  [
    type,
    normalizeText(subjectPlayerName),
    normalizeText(team),
    normalizeText(relatedPlayerName ?? ''),
    normalizeText(fromTeam ?? ''),
    normalizeText(toTeam ?? ''),
    String(effectiveWeek ?? 0),
  ].join('::');

export const createNormalizedEvent = (
  rawEvent: RawEvent,
  event: ProjectionEvent,
  assumptions: string[],
): NormalizedEvent => {
  const { qualityScore, qualityLabel } = scoreEventQuality(rawEvent, { event });
  const dedupeKey = buildDedupeKey(
    event.type,
    rawEvent.subjectPlayerName,
    rawEvent.subjectTeam,
    rawEvent.relatedPlayerName,
    rawEvent.fromTeam,
    rawEvent.toTeam,
    event.effectiveWeek,
  );

  return {
    id: `normalized-${rawEvent.id}`,
    dedupeKey,
    rawType: rawEvent.eventType,
    event,
    sourceIds: [rawEvent.id],
    sources: [rawEvent.source],
    sourceCount: 1,
    reportedAt: rawEvent.reportedAt,
    subjectPlayer: {
      id: rawEvent.subjectPlayerId,
      name: rawEvent.subjectPlayerName,
      team: rawEvent.subjectTeam,
      position: rawEvent.subjectPosition,
    },
    relatedPlayer: rawEvent.relatedPlayerName
      ? {
          id: rawEvent.relatedPlayerId,
          name: rawEvent.relatedPlayerName,
          team: rawEvent.relatedTeam ?? rawEvent.subjectTeam,
        }
      : undefined,
    qualityScore,
    qualityLabel,
    assumptions,
  };
};
