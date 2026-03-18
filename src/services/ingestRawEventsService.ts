import { normalizeEvents } from '../ingestion/normalize/normalizeEvent.js';
import { dedupeEvents } from '../ingestion/quality/dedupeEvents.js';
import type { RawEvent } from '../ingestion/types/rawEvent.js';
import { RawEventValidationError, validateRawEvents } from '../io/validateRawEvent.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { IngestRawEventsResult } from './types.js';

const toRawEventServiceError = (error: unknown) => {
  if (error instanceof RawEventValidationError) {
    return {
      code: 'RAW_EVENT_VALIDATION_FAILED',
      message: 'Raw event validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'RAW_EVENT_INGESTION_FAILED',
    message: error instanceof Error ? error.message : 'Unknown raw event ingestion error.',
  };
};

export const ingestRawEvents = (rawEvents: RawEvent[]): IngestRawEventsResult => {
  try {
    const validatedRawEvents = validateRawEvents(rawEvents);
    const normalizedEvents = normalizeEvents(validatedRawEvents);
    const dedupedEvents = dedupeEvents(normalizedEvents);
    const warnings =
      dedupedEvents.length < normalizedEvents.length
        ? [
            {
              code: 'DUPLICATE_EVENTS_REMOVED',
              message: `Collapsed ${normalizedEvents.length - dedupedEvents.length} duplicate raw event(s) during ingestion.`,
              details: {
                beforeCount: normalizedEvents.length,
                afterCount: dedupedEvents.length,
              },
            },
          ]
        : [];

    return serviceSuccess(
      {
        rawEvents: validatedRawEvents,
        normalizedEvents: dedupedEvents,
      },
      warnings,
    );
  } catch (error) {
    return serviceFailure(toRawEventServiceError(error));
  }
};
