import type { WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import type { RollingBacktestConfig } from '../datasets/types/split.js';
import { rollingBacktestWindows } from '../datasets/splits/rollingBacktestWindows.js';
import { predictWrTeBaselineModelValue } from '../models_ml/inference/predictWrTeBaselineModel.js';
import { trainWrTeBaselineModel } from '../models_ml/training/trainWrTeBaselineModel.js';
import { estimateResidualBands, type EstimateResidualBandsOptions, type ResidualBandInput } from '../models_ml/uncertainty/estimateResidualBands.js';
import type { WrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
import type { WrTeBaselineUncertaintyArtifact } from '../models_ml/types/uncertainty.js';
import type { CalibrationInput } from '../models_ml/calibration/buildCalibrationTable.js';

export interface BacktestObservationBuildOptions extends RollingBacktestConfig {
  generatedAt?: string;
  modelConfig?: Partial<WrTeBaselineModelConfig>;
  minimumBucketSize?: number;
}

export interface BacktestObservationBundle {
  inputs: CalibrationInput[];
  uncertaintyArtifact: WrTeBaselineUncertaintyArtifact;
}

export const buildBacktestObservationBundle = async (
  dataset: WrTeLabeledRow[],
  options: BacktestObservationBuildOptions,
): Promise<BacktestObservationBundle> => {
  const windows = rollingBacktestWindows(dataset, options);
  if (windows.length === 0) {
    throw new Error('No valid rolling backtest windows could be created for uncertainty evaluation.');
  }

  const residualBandInputs: ResidualBandInput[] = [];

  for (const window of windows) {
    const trained = await trainWrTeBaselineModel(window.train, {
      config: options.modelConfig,
      createdAt: options.generatedAt,
    });

    for (const row of window.test) {
      residualBandInputs.push({
        row,
        actual: row.target_fantasy_points_ppr,
        pointPrediction: predictWrTeBaselineModelValue(trained.artifact, row),
      });
    }
  }

  return {
    inputs: residualBandInputs,
    uncertaintyArtifact: estimateResidualBands(residualBandInputs, {
      generatedAt: options.generatedAt,
      minimumBucketSize: options.minimumBucketSize,
    } as EstimateResidualBandsOptions),
  };
};
