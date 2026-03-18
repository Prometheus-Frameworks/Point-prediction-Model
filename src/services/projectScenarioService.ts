import { validateScenario, ScenarioValidationError } from '../io/validateScenario.js';
import { runScenario } from '../models/scenarios/runScenario.js';
import type { ProjectionScenario } from '../types/scenario.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { ProjectScenarioResult } from './types.js';

const toScenarioServiceError = (error: unknown) => {
  if (error instanceof ScenarioValidationError) {
    return {
      code: 'SCENARIO_VALIDATION_FAILED',
      message: 'Scenario validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'SCENARIO_PROJECTION_FAILED',
    message: error instanceof Error ? error.message : 'Unknown scenario projection error.',
  };
};

export const projectScenario = (scenario: ProjectionScenario): ProjectScenarioResult => {
  try {
    const validatedScenario = validateScenario(scenario);
    const result = runScenario(validatedScenario);
    return serviceSuccess({ scenario: validatedScenario, result });
  } catch (error) {
    return serviceFailure(toScenarioServiceError(error));
  }
};
