import { describe, expect, it } from 'vitest';
import { loadScenarioFile } from '../src/io/loadScenarioFile.js';
import { runScenario } from '../src/models/scenarios/runScenario.js';

describe('batch execution', () => {
  it('loads scenarios from a file and runs each scenario deterministically', async () => {
    const scenarios = await loadScenarioFile('./src/examples/scenarios.sample.json');
    const results = scenarios.map((scenario) => runScenario(scenario));

    expect(results).toHaveLength(2);
    expect(results.every((result) => Number.isFinite(result.adjusted.pprPointsPerGame))).toBe(true);
    expect(results.map((result) => result.scenarioId)).toEqual([
      'sample-bowers-vacated-targets',
      'sample-wr-new-signing',
    ]);
  });
});
