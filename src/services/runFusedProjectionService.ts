import type { WrTeFeatureRow } from '../features/types/featureRow.js';
import { fuseScenarioWithModel } from '../fusion/core/fuseScenarioWithModel.js';
import type { FusionConfig } from '../fusion/types/fusionConfig.js';
import { validateScenario, ScenarioValidationError } from '../io/validateScenario.js';
import { runScenario } from '../models/scenarios/runScenario.js';
import type { ProjectionScenario } from '../types/scenario.js';
import { predictWithIntervalsService, type PredictWithIntervalsOptions } from './predictWithIntervalsService.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { RunFusedProjectionResult } from './types.js';

export interface RunFusedProjectionInput {
  row: WrTeFeatureRow;
  scenario: ProjectionScenario;
}

export interface RunFusedProjectionOptions extends PredictWithIntervalsOptions {
  fusionConfig?: Partial<FusionConfig>;
}

const toFusedProjectionError = (error: unknown) => {
  if (error instanceof ScenarioValidationError) {
    return {
      code: 'FUSED_PROJECTION_SCENARIO_VALIDATION_FAILED',
      message: 'Fusion scenario validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'FUSED_PROJECTION_FAILED',
    message: error instanceof Error ? error.message : 'Unknown fused projection error.',
  };
};

export const runFusedProjectionService = async (
  input: RunFusedProjectionInput,
  options: RunFusedProjectionOptions,
): Promise<RunFusedProjectionResult> => {
  try {
    const predictionResult = await predictWithIntervalsService([input.row], options);
    if (!predictionResult.ok) {
      return predictionResult;
    }

    const scenario = validateScenario(input.scenario);
    const scenarioResult = runScenario(scenario);
    const baselinePrediction = predictionResult.data.predictions[0];

    if (!baselinePrediction) {
      return serviceFailure({
        code: 'FUSED_PROJECTION_BASELINE_MISSING',
        message: 'Expected a baseline prediction for the requested fused projection input.',
      });
    }

    return serviceSuccess({
      row: input.row,
      scenario,
      scenarioResult,
      baselinePrediction,
      fusedProjection: fuseScenarioWithModel({
        row: input.row,
        baselinePrediction,
        scenarioResult,
        config: options.fusionConfig,
      }),
    }, predictionResult.warnings);
  } catch (error) {
    return serviceFailure(toFusedProjectionError(error));
  }
};
