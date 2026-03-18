import { describe, expect, it } from 'vitest';
import { parseScenarioJson } from '../src/io/parseScenarioJson.js';
import { ScenarioValidationError, validateScenarios } from '../src/io/validateScenario.js';
import { waddleToBroncosScenario } from '../src/data/scenarios/waddleToBroncos.js';

describe('scenario validation', () => {
  it('fails on duplicate ids', () => {
    expect(() => validateScenarios([waddleToBroncosScenario, waddleToBroncosScenario])).toThrowError(
      /must be unique/,
    );
  });

  it('fails on invalid numeric ranges and unsupported event types', () => {
    const invalidJson = JSON.stringify([
      {
        ...waddleToBroncosScenario,
        metadata: {
          ...waddleToBroncosScenario.metadata,
          id: 'invalid-range',
        },
        player: {
          ...waddleToBroncosScenario.player,
          catchRate: 1.2,
        },
        event: {
          ...waddleToBroncosScenario.event,
          type: 'UNSUPPORTED_EVENT',
        },
      },
    ]);

    expect(() => parseScenarioJson(invalidJson)).toThrowError(ScenarioValidationError);
    expect(() => parseScenarioJson(invalidJson)).toThrowError(/catchRate must be between 0 and 1/);
    expect(() => parseScenarioJson(invalidJson)).toThrowError(/must be one of/);
  });
});
