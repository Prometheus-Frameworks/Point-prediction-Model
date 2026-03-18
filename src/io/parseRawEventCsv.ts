import type { RawEvent } from '../ingestion/types/rawEvent.js';
import { validateRawEvents } from './validateRawEvent.js';

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const parseNumber = (value: string): number | undefined => {
  if (value.trim() === '') {
    return undefined;
  }

  return Number(value);
};

const mapRecordToRawEvent = (record: Record<string, string>): RawEvent => ({
  id: record.id,
  source: record.source,
  sourceEventId: record.sourceEventId || undefined,
  eventType: record.eventType as RawEvent['eventType'],
  headline: record.headline,
  summary: record.summary || undefined,
  reportedAt: record.reportedAt,
  effectiveWeek: parseNumber(record.effectiveWeek),
  certainty: (record.certainty || undefined) as RawEvent['certainty'],
  subjectPlayerName: record.subjectPlayerName,
  subjectPlayerId: record.subjectPlayerId || undefined,
  subjectTeam: record.subjectTeam,
  subjectPosition: (record.subjectPosition || undefined) as RawEvent['subjectPosition'],
  relatedPlayerName: record.relatedPlayerName || undefined,
  relatedPlayerId: record.relatedPlayerId || undefined,
  relatedTeam: record.relatedTeam || undefined,
  fromTeam: record.fromTeam || undefined,
  toTeam: record.toTeam || undefined,
  severity: parseNumber(record.severity),
  notes: record.notes || undefined,
});

export const parseRawEventCsv = (raw: string): RawEvent[] => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return validateRawEvents([]);
  }

  const headers = parseCsvLine(lines[0]);
  const records = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });

    return mapRecordToRawEvent(record);
  });

  return validateRawEvents(records);
};
