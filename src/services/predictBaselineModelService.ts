import { loadModelArtifact } from '../models_ml/inference/loadModelArtifact.js';
import { predictWrTeBaselineModel } from '../models_ml/inference/predictWrTeBaselineModel.js';
import type { WrTeFeatureRow } from '../features/types/featureRow.js';
import type { WrTeBaselineModelArtifact } from '../models_ml/types/modelArtifact.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { PredictBaselineModelResult } from './types.js';

export interface PredictBaselineModelOptions {
  artifact?: WrTeBaselineModelArtifact;
  artifactPath?: string;
}

export const predictBaselineModelService = async (
  rows: WrTeFeatureRow[],
  options: PredictBaselineModelOptions,
): Promise<PredictBaselineModelResult> => {
  try {
    const artifact = options.artifact ?? (options.artifactPath ? await loadModelArtifact(options.artifactPath) : null);
    if (!artifact) {
      return serviceFailure({
        code: 'BASELINE_MODEL_ARTIFACT_MISSING',
        message: 'Provide either an in-memory artifact or an artifact path before requesting predictions.',
      });
    }

    return serviceSuccess({
      artifact,
      predictions: predictWrTeBaselineModel(artifact, rows),
    });
  } catch (error) {
    return serviceFailure({
      code: 'BASELINE_MODEL_PREDICTION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown baseline model prediction error.',
    });
  }
};
