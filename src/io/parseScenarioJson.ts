import type { ProjectionScenario } from '../types/scenario.js';
import { ScenarioValidationError, validateScenarios } from './validateScenario.js';

export const parseScenarioJson = (raw: string): ProjectionScenario[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return validateScenarios(parsed);
  } catch (error) {
    if (error instanceof ScenarioValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new ScenarioValidationError([`Invalid JSON input: ${message}`]);
  }
};
