import type { NormalizedEvent } from '../ingestion/types/normalizedEvent.js';

const formatCell = (value: string | number, width: number) => String(value).padEnd(width, ' ');

export const formatIngestSummaryTable = (events: NormalizedEvent[]): string => {
  const rows = events.map((event) => ({
    id: event.id,
    player: event.subjectPlayer.name,
    eventType: event.event.type,
    team: event.subjectPlayer.team,
    quality: `${event.qualityLabel} (${event.qualityScore})`,
    sources: String(event.sourceCount),
    effectiveWeek: String(event.event.effectiveWeek),
  }));

  const headers = ['id', 'player', 'eventType', 'team', 'quality', 'sources', 'effectiveWeek'] as const;
  const widths = headers.map((header) => Math.max(header.length, ...rows.map((row) => row[header].length)));

  const headerRow = headers.map((header, index) => formatCell(header, widths[index])).join(' | ');
  const dividerRow = widths.map((width) => '-'.repeat(width)).join('-|-');
  const dataRows = rows.map((row) => headers.map((header, index) => formatCell(row[header], widths[index])).join(' | '));

  return [headerRow, dividerRow, ...dataRows].join('\n');
};
