import { baselineMeanModel } from '../datasets/benchmarks/baselineMeanModel.js';
import { baselineRecentTrendModel } from '../datasets/benchmarks/baselineRecentTrendModel.js';
import { baselineUsageModel } from '../datasets/benchmarks/baselineUsageModel.js';
import { evaluatePredictions } from '../datasets/evaluation/evaluatePredictions.js';
import { generateBacktestReport } from '../datasets/evaluation/generateBacktestReport.js';
import type { PredictionRecord, WindowEvaluation } from '../datasets/types/metrics.js';
import type { WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import type { RollingBacktestConfig } from '../datasets/types/split.js';
import { rollingBacktestWindows } from '../datasets/splits/rollingBacktestWindows.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { RunBacktestResult } from './types.js';

export interface RunBacktestOptions extends RollingBacktestConfig {
  generatedAt?: string;
}

const buildPredictionRecord = (
  model: string,
  row: WrTeLabeledRow,
  predicted: number,
): PredictionRecord => ({
  model,
  rowId: row.row_id,
  playerId: row.player_id,
  playerName: row.player_name,
  position: row.player_position,
  eventType: row.event_type,
  season: row.season,
  week: row.week,
  predicted,
  actual: row.target_fantasy_points_ppr,
  absoluteError: Math.abs(predicted - row.target_fantasy_points_ppr),
  squaredError: (predicted - row.target_fantasy_points_ppr) ** 2,
});

export const runBacktestService = (
  dataset: WrTeLabeledRow[],
  options: RunBacktestOptions,
): RunBacktestResult => {
  try {
    const windows = rollingBacktestWindows(dataset, options);
    if (windows.length === 0) {
      return serviceFailure({
        code: 'BACKTEST_WINDOWS_EMPTY',
        message: 'No valid rolling backtest windows could be created for the supplied dataset and configuration.',
      });
    }

    const windowEvaluations: WindowEvaluation[] = [];

    for (const window of windows) {
      const models = [
        baselineMeanModel(window.train),
        baselineRecentTrendModel(window.train),
        baselineUsageModel(window.train),
      ];

      for (const model of models) {
        const predictions = window.test.map((row) => buildPredictionRecord(model.name, row, model.predict(row)));
        windowEvaluations.push({
          windowIndex: window.index,
          model: model.name,
          metrics: evaluatePredictions(predictions),
          predictions,
          window,
        });
      }
    }

    return serviceSuccess({
      dataset: [...dataset],
      windows,
      evaluations: windowEvaluations,
      report: generateBacktestReport(dataset.length, windowEvaluations, options.generatedAt),
    });
  } catch (error) {
    return serviceFailure({
      code: 'BACKTEST_FAILED',
      message: error instanceof Error ? error.message : 'Unknown backtest execution error.',
    });
  }
};
