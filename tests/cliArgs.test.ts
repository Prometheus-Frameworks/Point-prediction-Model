import { describe, expect, it } from 'vitest';
import { parseCliArgs } from '../src/cli/parseCliArgs.js';

describe('CLI argument handling', () => {
  it('supports default, all, scenario, and file modes', () => {
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
  });

  it('throws readable errors for bad arguments', () => {
    expect(() => parseCliArgs(['scenario'])).toThrowError(/Missing scenario id/);
    expect(() => parseCliArgs(['file'])).toThrowError(/Missing file path/);
    expect(() => parseCliArgs(['all', '--export', 'xml'])).toThrowError(/Invalid export format/);
  });
});
