import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseRawEventCsv } from '../src/io/parseRawEventCsv.js';
import { parseRawEventJson } from '../src/io/parseRawEventJson.js';

const examplesDir = path.resolve('src/ingestion/examples');

describe('raw event parsing', () => {
  it('parses JSON raw event arrays', () => {
    const raw = readFileSync(path.join(examplesDir, 'raw-events.sample.json'), 'utf8');
    const events = parseRawEventJson(raw);

    expect(events).toHaveLength(5);
    expect(events[0].eventType).toBe('TRADE');
    expect(events[1].relatedPlayerName).toBe('Davante Adams');
  });

  it('parses CSV raw event files', () => {
    const raw = readFileSync(path.join(examplesDir, 'raw-events.sample.csv'), 'utf8');
    const events = parseRawEventCsv(raw);

    expect(events).toHaveLength(5);
    expect(events[2].eventType).toBe('SIGNING');
    expect(events[3].subjectPosition).toBeUndefined();
  });
});
