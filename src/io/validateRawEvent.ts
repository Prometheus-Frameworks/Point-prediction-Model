import type { RawEvent, RawEventCertainty, RawEventType } from '../ingestion/types/rawEvent.js';

const supportedRawEventTypes: RawEventType[] = ['TRADE', 'INJURY', 'SIGNING', 'ROOKIE'];
const supportedCertainty: RawEventCertainty[] = ['CONFIRMED', 'LIKELY', 'SPECULATIVE'];

export class RawEventValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Raw event validation failed:\n- ${issues.join('\n- ')}`);
    this.name = 'RawEventValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const addRequiredString = (issues: string[], value: unknown, path: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push(`${path} is required and must be a non-empty string.`);
  }
};

const addOptionalNumberRange = (
  issues: string[],
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
) => {
  if (value === undefined) {
    return;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    issues.push(`${path} must be a number when provided.`);
    return;
  }

  if (value < minimum || value > maximum) {
    issues.push(`${path} must be between ${minimum} and ${maximum}. Received ${value}.`);
  }
};

const addEventSpecificIssues = (event: Record<string, unknown>, path: string, issues: string[]) => {
  switch (event.eventType) {
    case 'TRADE':
      addRequiredString(issues, event.fromTeam, `${path}.fromTeam`);
      addRequiredString(issues, event.toTeam, `${path}.toTeam`);
      break;
    case 'INJURY':
      addRequiredString(issues, event.relatedPlayerName, `${path}.relatedPlayerName`);
      break;
    case 'SIGNING':
      addRequiredString(issues, event.relatedPlayerName, `${path}.relatedPlayerName`);
      break;
    case 'ROOKIE':
      addRequiredString(issues, event.relatedPlayerName, `${path}.relatedPlayerName`);
      break;
    default:
      break;
  }
};

const cloneRawEvent = (event: RawEvent): RawEvent => ({ ...event });

export const validateRawEvent = (rawEvent: unknown, index?: number): RawEvent => {
  const issues: string[] = [];
  const prefix = index === undefined ? 'rawEvent' : `rawEvent[${index}]`;

  if (!isRecord(rawEvent)) {
    throw new RawEventValidationError([`${prefix} must be an object.`]);
  }

  addRequiredString(issues, rawEvent.id, `${prefix}.id`);
  addRequiredString(issues, rawEvent.source, `${prefix}.source`);
  addRequiredString(issues, rawEvent.headline, `${prefix}.headline`);
  addRequiredString(issues, rawEvent.reportedAt, `${prefix}.reportedAt`);
  addRequiredString(issues, rawEvent.subjectPlayerName, `${prefix}.subjectPlayerName`);
  addRequiredString(issues, rawEvent.subjectTeam, `${prefix}.subjectTeam`);

  if (!supportedRawEventTypes.includes(rawEvent.eventType as RawEventType)) {
    issues.push(
      `${prefix}.eventType must be one of ${supportedRawEventTypes.join(', ')}. Received ${String(rawEvent.eventType)}.`,
    );
  }

  if (
    rawEvent.certainty !== undefined &&
    !supportedCertainty.includes(rawEvent.certainty as RawEventCertainty)
  ) {
    issues.push(
      `${prefix}.certainty must be one of ${supportedCertainty.join(', ')} when provided. Received ${String(rawEvent.certainty)}.`,
    );
  }

  if (
    rawEvent.subjectPosition !== undefined &&
    rawEvent.subjectPosition !== 'WR' &&
    rawEvent.subjectPosition !== 'TE'
  ) {
    issues.push(`${prefix}.subjectPosition must be WR or TE when provided.`);
  }

  addOptionalNumberRange(issues, rawEvent.effectiveWeek, `${prefix}.effectiveWeek`, 1, 18);
  addOptionalNumberRange(issues, rawEvent.severity, `${prefix}.severity`, 0, 10);

  const reportedAt = rawEvent.reportedAt;
  if (typeof reportedAt === 'string' && Number.isNaN(Date.parse(reportedAt))) {
    issues.push(`${prefix}.reportedAt must be a valid ISO-8601 date string.`);
  }

  addEventSpecificIssues(rawEvent, prefix, issues);

  if (issues.length > 0) {
    throw new RawEventValidationError(issues);
  }

  return cloneRawEvent(rawEvent as unknown as RawEvent);
};

export const validateRawEvents = (rawEvents: unknown): RawEvent[] => {
  if (!Array.isArray(rawEvents)) {
    throw new RawEventValidationError(['Input must be a JSON array or CSV file containing one or more raw events.']);
  }

  const validated = rawEvents.map((rawEvent, index) => validateRawEvent(rawEvent, index));
  const seenIds = new Set<string>();
  const duplicates = new Set<string>();

  for (const rawEvent of validated) {
    if (seenIds.has(rawEvent.id)) {
      duplicates.add(rawEvent.id);
    }

    seenIds.add(rawEvent.id);
  }

  if (duplicates.size > 0) {
    throw new RawEventValidationError(
      Array.from(duplicates).map((id) => `Raw event id '${id}' must be unique.`),
    );
  }

  return validated;
};
