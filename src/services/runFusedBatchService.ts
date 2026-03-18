import type { WrTeFeatureRow } from '../features/types/featureRow.js';
import { fuseScenarioWithModel } from '../fusion/core/fuseScenarioWithModel.js';
import type { FusionConfig } from '../fusion/types/fusionConfig.js';
import { validateScenarios, ScenarioValidationError } from '../io/validateScenario.js';
import { runScenario } from '../models/scenarios/runScenario.js';
import type { ProjectionScenario } from '../types/scenario.js';
import { mergeServiceWarnings, serviceFailure, serviceSuccess } from './result.js';
import { predictWithIntervalsService, type PredictWithIntervalsOptions } from './predictWithIntervalsService.js';
import type { RunFusedBatchResult } from './types.js';

export interface RunFusedBatchInput {
  rows: WrTeFeatureRow[];
  scenarios: ProjectionScenario[];
}

export interface RunFusedBatchOptions extends PredictWithIntervalsOptions {
  fusionConfig?: Partial<FusionConfig>;
}

const toFusedBatchError = (error: unknown) => {
  if (error instanceof ScenarioValidationError) {
    return {
      code: 'FUSED_BATCH_SCENARIO_VALIDATION_FAILED',
      message: 'Fusion scenario batch validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'FUSED_BATCH_FAILED',
    message: error instanceof Error ? error.message : 'Unknown fused batch error.',
  };
};

export const runFusedBatchService = async (
  input: RunFusedBatchInput,
  options: RunFusedBatchOptions,
): Promise<RunFusedBatchResult> => {
  try {
    if (input.rows.length !== input.scenarios.length) {
      return serviceFailure({
        code: 'FUSED_BATCH_INPUT_MISMATCH',
        message: 'Rows and scenarios must have the same length for fused batch execution.',
        details: { rows: input.rows.length, scenarios: input.scenarios.length },
      });
    }

    const validatedScenarios = validateScenarios(input.scenarios);
    const predictionResult = await predictWithIntervalsService(input.rows, options);
    if (!predictionResult.ok) {
      return predictionResult;
    }

    const scenarioResults = validatedScenarios.map((scenario) => runScenario(scenario));
    const fusedProjections = scenarioResults.map((scenarioResult, index) => {
      const baselinePrediction = predictionResult.data.predictions[index];
      const row = input.rows[index];

      if (!baselinePrediction || !row) {
        throw new Error(`Missing row or baseline prediction at index ${index}.`);
      }

      return fuseScenarioWithModel({
        row,
        baselinePrediction,
        scenarioResult,
        config: options.fusionConfig,
      });
    });

    const warnings = mergeServiceWarnings(
      predictionResult.warnings,
      input.rows.length === 0
        ? [{ code: 'NO_FUSED_INPUTS', message: 'No fused inputs were provided, so no fused projections were generated.' }]
        : [],
    );

    return serviceSuccess({
      rows: [...input.rows],
      scenarios: validatedScenarios,
      scenarioResults,
      baselinePredictions: predictionResult.data.predictions,
      fusedProjections,
    }, warnings);
  } catch (error) {
    return serviceFailure(toFusedBatchError(error));
  }
};
