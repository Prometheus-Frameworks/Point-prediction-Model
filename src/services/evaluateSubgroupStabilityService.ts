import type { WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import { evaluateSubgroupStability } from '../models_ml/subgroup/evaluateSubgroupStability.js';
import type { WrTeBaselineUncertaintyArtifact } from '../models_ml/types/uncertainty.js';
import { serviceFailure, serviceSuccess } from './result.js';
import { buildBacktestObservationBundle, type BacktestObservationBuildOptions } from './sharedBacktestModelObservations.js';
import type { EvaluateSubgroupStabilityResult } from './types.js';

export interface EvaluateSubgroupStabilityOptions extends BacktestObservationBuildOptions {
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact;
}

export const evaluateSubgroupStabilityService = async (
  dataset: WrTeLabeledRow[],
  options: EvaluateSubgroupStabilityOptions,
): Promise<EvaluateSubgroupStabilityResult> => {
  try {
    const bundle = await buildBacktestObservationBundle(dataset, options);
    const uncertaintyArtifact = options.uncertaintyArtifact ?? bundle.uncertaintyArtifact;
    const report = evaluateSubgroupStability(bundle.inputs, uncertaintyArtifact, options.generatedAt);

    return serviceSuccess({
      uncertaintyArtifact,
      report,
    });
  } catch (error) {
    return serviceFailure({
      code: 'MODEL_SUBGROUP_STABILITY_EVALUATION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown subgroup stability evaluation error.',
    });
  }
};
