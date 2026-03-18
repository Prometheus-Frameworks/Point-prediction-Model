import type { WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import { evaluateCalibration } from '../models_ml/calibration/evaluateCalibration.js';
import type { WrTeBaselineUncertaintyArtifact } from '../models_ml/types/uncertainty.js';
import { serviceFailure, serviceSuccess } from './result.js';
import { buildBacktestObservationBundle, type BacktestObservationBuildOptions } from './sharedBacktestModelObservations.js';
import type { EvaluateCalibrationResult } from './types.js';

export interface EvaluateCalibrationOptions extends BacktestObservationBuildOptions {
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact;
}

export const evaluateCalibrationService = async (
  dataset: WrTeLabeledRow[],
  options: EvaluateCalibrationOptions,
): Promise<EvaluateCalibrationResult> => {
  try {
    const bundle = await buildBacktestObservationBundle(dataset, options);
    const uncertaintyArtifact = options.uncertaintyArtifact ?? bundle.uncertaintyArtifact;
    const report = evaluateCalibration(bundle.inputs, uncertaintyArtifact, options.generatedAt);
    uncertaintyArtifact.calibrationSummary = report.overall;

    return serviceSuccess({
      uncertaintyArtifact,
      report,
    });
  } catch (error) {
    return serviceFailure({
      code: 'MODEL_CALIBRATION_EVALUATION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown calibration evaluation error.',
    });
  }
};
