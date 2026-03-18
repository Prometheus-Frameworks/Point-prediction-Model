import { generateBacktestReport } from '../datasets/evaluation/generateBacktestReport.js';
import type { WindowEvaluation } from '../datasets/types/metrics.js';
import type { WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import type { RollingBacktestConfig } from '../datasets/types/split.js';
import { rollingBacktestWindows } from '../datasets/splits/rollingBacktestWindows.js';
import { evaluateModelAgainstBenchmarks } from '../models_ml/evaluation/evaluateModelAgainstBenchmarks.js';
import type { WrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { RunModelBacktestResult } from './types.js';

export interface RunModelBacktestOptions extends RollingBacktestConfig {
  generatedAt?: string;
  modelConfig?: Partial<WrTeBaselineModelConfig>;
}

export const runModelBacktestService = async (
  dataset: WrTeLabeledRow[],
  options: RunModelBacktestOptions,
): Promise<RunModelBacktestResult> => {
  try {
    const windows = rollingBacktestWindows(dataset, options);
    if (windows.length === 0) {
      return serviceFailure({
        code: 'MODEL_BACKTEST_WINDOWS_EMPTY',
        message: 'No valid rolling backtest windows could be created for the supplied dataset and configuration.',
      });
    }

    const evaluations: WindowEvaluation[] = [];
    const comparisons = [];

    for (const window of windows) {
      const comparisonResult = await evaluateModelAgainstBenchmarks(window.train, window.test, {
        config: options.modelConfig,
        createdAt: options.generatedAt,
      });
      comparisons.push({ windowIndex: window.index, comparison: comparisonResult.comparison, featureImportance: comparisonResult.artifact.featureImportance });
      for (const model of comparisonResult.models) {
        evaluations.push({
          windowIndex: window.index,
          model: model.model,
          metrics: model.metrics,
          predictions: model.predictions,
          window,
        });
      }
    }

    return serviceSuccess({
      dataset: [...dataset],
      windows,
      evaluations,
      report: generateBacktestReport(dataset.length, evaluations, options.generatedAt),
      comparisons,
    });
  } catch (error) {
    return serviceFailure({
      code: 'MODEL_BACKTEST_FAILED',
      message: error instanceof Error ? error.message : 'Unknown learned-model backtest execution error.',
    });
  }
};
