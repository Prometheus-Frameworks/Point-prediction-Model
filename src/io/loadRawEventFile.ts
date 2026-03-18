import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RawEvent } from '../ingestion/types/rawEvent.js';
import { parseRawEventCsv } from './parseRawEventCsv.js';
import { parseRawEventJson } from './parseRawEventJson.js';
import { RawEventValidationError } from './validateRawEvent.js';

export const loadRawEventFile = async (filePath: string): Promise<RawEvent[]> => {
  const resolvedPath = path.resolve(filePath);
  const extension = path.extname(resolvedPath).toLowerCase();
  const raw = await readFile(resolvedPath, 'utf8');

  if (extension === '.json') {
    return parseRawEventJson(raw);
  }

  if (extension === '.csv') {
    return parseRawEventCsv(raw);
  }

  throw new RawEventValidationError([
    `Unsupported file extension '${extension || '(none)'}'. Use .json or .csv raw event files.`,
  ]);
};
