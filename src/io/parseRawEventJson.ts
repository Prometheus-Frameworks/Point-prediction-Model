import type { RawEvent } from '../ingestion/types/rawEvent.js';
import { RawEventValidationError, validateRawEvents } from './validateRawEvent.js';

export const parseRawEventJson = (raw: string): RawEvent[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return validateRawEvents(parsed);
  } catch (error) {
    if (error instanceof RawEventValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new RawEventValidationError([`Invalid JSON input: ${message}`]);
  }
};
