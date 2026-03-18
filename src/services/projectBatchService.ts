import { validateScenarios, ScenarioValidationError } from '../io/validateScenario.js';
import { runScenario } from '../models/scenarios/runScenario.js';
import type { ProjectionScenario } from '../types/scenario.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { ProjectBatchResult } from './types.js';

const toBatchProjectionError = (error: unknown) => {
  if (error instanceof ScenarioValidationError) {
    return {
      code: 'SCENARIO_BATCH_VALIDATION_FAILED',
      message: 'Scenario batch validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'SCENARIO_BATCH_PROJECTION_FAILED',
    message: error instanceof Error ? error.message : 'Unknown batch projection error.',
  };
};

export const projectBatch = (scenarios: ProjectionScenario[]): ProjectBatchResult => {
  try {
    const validatedScenarios = validateScenarios(scenarios);
    const results = validatedScenarios.map((scenario) => runScenario(scenario));
    const warnings =
      validatedScenarios.length === 0
        ? [
            {
              code: 'NO_SCENARIOS',
              message: 'No scenarios were provided, so no projections were generated.',
            },
          ]
        : [];

    return serviceSuccess({ scenarios: validatedScenarios, results }, warnings);
  } catch (error) {
    return serviceFailure(toBatchProjectionError(error));
  }
};
