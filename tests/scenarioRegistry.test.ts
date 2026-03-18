import { describe, expect, it } from 'vitest';
import { scenarioRegistry } from '../src/models/scenarios/registry.js';

describe('scenario registry', () => {
  it('contains seeded scenarios with unique ids', () => {
    const ids = scenarioRegistry.map((scenario) => scenario.metadata.id);
    expect(scenarioRegistry.length).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size).toBe(ids.length);
    expect(scenarioRegistry.every((scenario) => scenario.event.type)).toBe(true);
  });
});
