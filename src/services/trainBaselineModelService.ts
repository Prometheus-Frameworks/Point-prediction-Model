import { trainWrTeBaselineModel } from '../models_ml/training/trainWrTeBaselineModel.js';
import type { WrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
import type { WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { TrainBaselineModelResult } from './types.js';

export interface TrainBaselineModelOptions {
  config?: Partial<WrTeBaselineModelConfig>;
  artifactOutputPath?: string;
  createdAt?: string;
}

export const trainBaselineModelService = async (
  rows: WrTeLabeledRow[],
  options: TrainBaselineModelOptions = {},
): Promise<TrainBaselineModelResult> => {
  try {
    const result = await trainWrTeBaselineModel(rows, options);
    return serviceSuccess(result);
  } catch (error) {
    return serviceFailure({
      code: 'BASELINE_MODEL_TRAINING_FAILED',
      message: error instanceof Error ? error.message : 'Unknown baseline model training error.',
    });
  }
};
