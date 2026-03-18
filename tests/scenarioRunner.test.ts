import { describe, expect, it } from 'vitest';
import { waddleToBroncosScenario } from '../src/data/scenarios/waddleToBroncos.js';
import { runScenario } from '../src/models/scenarios/runScenario.js';

describe('runScenario', () => {
  it('returns enriched output for a scenario', () => {
    const output = runScenario(waddleToBroncosScenario);

    expect(output.eventType).toBe('PLAYER_TRADE');
    expect(output.delta.pprPointsPerGame).toBe(output.deltaPprPointsPerGame);
    expect(output.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(output.confidenceScore).toBeLessThanOrEqual(100);
    expect(output.explanation.length).toBeGreaterThan(5);
  });
});
