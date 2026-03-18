import { describe, expect, it } from 'vitest';
import { parseCliArgs } from '../src/cli/parseCliArgs.js';

describe('CLI argument handling', () => {
  it('supports default, all, scenario, file, and ingest modes', () => {
    expect(parseCliArgs([])).toEqual({ mode: 'default', exportFormat: undefined });
    expect(parseCliArgs(['all'])).toEqual({ mode: 'all', exportFormat: undefined });
    expect(parseCliArgs(['scenario', 'waddle-to-broncos'])).toEqual({
      mode: 'scenario',
      scenarioId: 'waddle-to-broncos',
      exportFormat: undefined,
    });
    expect(parseCliArgs(['file', './src/examples/scenarios.sample.json', '--export', 'json'])).toEqual({
      mode: 'file',
      filePath: './src/examples/scenarios.sample.json',
      exportFormat: 'json',
    });
    expect(parseCliArgs(['ingest', './src/ingestion/examples/raw-events.sample.json', '--export', 'json'])).toEqual({
      mode: 'ingest',
      filePath: './src/ingestion/examples/raw-events.sample.json',
      exportFormat: 'json',
    });
  });

  it('throws readable errors for bad arguments', () => {
    expect(() => parseCliArgs(['scenario'])).toThrowError(/Missing scenario id/);
    expect(() => parseCliArgs(['file'])).toThrowError(/Missing file path/);
    expect(() => parseCliArgs(['ingest'])).toThrowError(/Missing file path/);
    expect(() => parseCliArgs(['all', '--export', 'xml'])).toThrowError(/Invalid export format/);
    expect(() => parseCliArgs(['ingest', './events.csv', '--export', 'csv'])).toThrowError(/Ingest mode only supports/);
  });
});
