import type { NormalizedEvent } from '../types/normalizedEvent.js';

const sortUnique = (values: string[]) => Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));

export const dedupeEvents = (events: NormalizedEvent[]): NormalizedEvent[] => {
  const deduped = new Map<string, NormalizedEvent>();

  for (const event of events) {
    const existing = deduped.get(event.dedupeKey);

    if (!existing) {
      deduped.set(event.dedupeKey, {
        ...event,
        sourceIds: [...event.sourceIds],
        sources: [...event.sources],
        assumptions: [...event.assumptions],
      });
      continue;
    }

    deduped.set(event.dedupeKey, {
      ...existing,
      id: existing.qualityScore >= event.qualityScore ? existing.id : event.id,
      reportedAt: existing.reportedAt <= event.reportedAt ? existing.reportedAt : event.reportedAt,
      sourceIds: sortUnique([...existing.sourceIds, ...event.sourceIds]),
      sources: sortUnique([...existing.sources, ...event.sources]),
      sourceCount: new Set([...existing.sources, ...event.sources]).size,
      qualityScore: Math.max(existing.qualityScore, event.qualityScore),
      qualityLabel: existing.qualityScore >= event.qualityScore ? existing.qualityLabel : event.qualityLabel,
      assumptions: sortUnique([...existing.assumptions, ...event.assumptions]),
    });
  }

  return Array.from(deduped.values());
};
