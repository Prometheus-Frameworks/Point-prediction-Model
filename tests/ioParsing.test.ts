import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseScenarioCsv } from '../src/io/parseScenarioCsv.js';
import { parseScenarioJson } from '../src/io/parseScenarioJson.js';

const examplesDir = path.resolve('src/examples');

describe('scenario file parsing', () => {
  it('parses JSON arrays of scenarios', () => {
    const raw = readFileSync(path.join(examplesDir, 'scenarios.sample.json'), 'utf8');
    const scenarios = parseScenarioJson(raw);

    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].metadata.id).toBe('sample-bowers-vacated-targets');
    expect(scenarios[1].event.type).toBe('PLAYER_SIGNING');
  });

  it('parses flattened CSV scenarios', () => {
    const raw = readFileSync(path.join(examplesDir, 'scenarios.sample.csv'), 'utf8');
    const scenarios = parseScenarioCsv(raw);

    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].metadata.tags).toEqual(['sample', 'te']);
    expect(scenarios[0].event.materiallyChangedVariables).toEqual([
      'routesPerGame',
      'targetsPerRouteRun',
    ]);
  });
});
