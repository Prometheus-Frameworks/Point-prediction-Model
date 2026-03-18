import type { WrTeFeatureRow } from '../features/types/featureRow.js';
import { loadModelArtifact } from '../models_ml/inference/loadModelArtifact.js';
import { predictWrTeBaselineModel } from '../models_ml/inference/predictWrTeBaselineModel.js';
import type { WrTeBaselineModelArtifact } from '../models_ml/types/modelArtifact.js';
import type { WrTeBaselineUncertaintyArtifact } from '../models_ml/types/uncertainty.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { PredictBaselineModelResult } from './types.js';

export interface PredictWithIntervalsOptions {
  artifact?: WrTeBaselineModelArtifact;
  artifactPath?: string;
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact;
}

export const predictWithIntervalsService = async (
  rows: WrTeFeatureRow[],
  options: PredictWithIntervalsOptions,
): Promise<PredictBaselineModelResult> => {
  try {
    const artifact = options.artifact ?? (options.artifactPath ? await loadModelArtifact(options.artifactPath) : null);
    if (!artifact) {
      return serviceFailure({
        code: 'BASELINE_MODEL_ARTIFACT_MISSING',
        message: 'Provide either an in-memory artifact or an artifact path before requesting interval predictions.',
      });
    }

    const intervalReadyArtifact: WrTeBaselineModelArtifact = {
      ...artifact,
      uncertaintyMetadata: options.uncertaintyArtifact ?? artifact.uncertaintyMetadata,
    };

    return serviceSuccess({
      artifact: intervalReadyArtifact,
      predictions: predictWrTeBaselineModel(intervalReadyArtifact, rows),
    });
  } catch (error) {
    return serviceFailure({
      code: 'BASELINE_MODEL_INTERVAL_PREDICTION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown baseline model interval prediction error.',
    });
  }
};
