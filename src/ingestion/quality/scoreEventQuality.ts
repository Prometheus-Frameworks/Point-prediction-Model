import type { NormalizedEvent, EventQualityLabel } from '../types/normalizedEvent.js';
import type { RawEvent } from '../types/rawEvent.js';

const certaintyScore: Record<NonNullable<RawEvent['certainty']>, number> = {
  CONFIRMED: 28,
  LIKELY: 18,
  SPECULATIVE: 8,
};

export interface EventQualityResult {
  qualityScore: number;
  qualityLabel: EventQualityLabel;
}

export const scoreEventQuality = (rawEvent: RawEvent, normalizedEvent?: Pick<NormalizedEvent, 'event'>): EventQualityResult => {
  let score = 20;

  if (rawEvent.summary) {
    score += 8;
  }

  if (rawEvent.subjectPlayerId) {
    score += 8;
  }

  if (rawEvent.subjectPosition) {
    score += 6;
  }

  if (rawEvent.relatedPlayerName) {
    score += 6;
  }

  if (rawEvent.effectiveWeek !== undefined) {
    score += 6;
  }

  if (rawEvent.severity !== undefined) {
    score += 6;
  }

  if (rawEvent.notes) {
    score += 4;
  }

  if (rawEvent.certainty) {
    score += certaintyScore[rawEvent.certainty];
  } else {
    score += 14;
  }

  if (normalizedEvent?.event.materiallyChangedVariables?.length) {
    score += Math.min(normalizedEvent.event.materiallyChangedVariables.length * 2, 10);
  }

  const qualityScore = Math.max(0, Math.min(100, score));
  const qualityLabel: EventQualityLabel =
    qualityScore >= 80 ? 'HIGH' : qualityScore >= 55 ? 'MEDIUM' : 'LOW';

  return { qualityScore, qualityLabel };
};
