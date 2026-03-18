import { aggregateMetrics } from './aggregateMetrics.js';
import { seasonWeekLabel } from '../splits/rollingBacktestWindows.js';
import type { BacktestReport, WindowEvaluation } from '../types/metrics.js';

export const generateBacktestReport = (
  datasetSize: number,
  windowEvaluations: WindowEvaluation[],
  generatedAt = new Date().toISOString(),
): BacktestReport => {
  const modelNames = [...new Set(windowEvaluations.map((evaluation) => evaluation.model))];

  return {
    datasetSize,
    windowCount: [...new Set(windowEvaluations.map((evaluation) => evaluation.windowIndex))].length,
    generatedAt,
    models: modelNames.map((model) => {
      const aggregated = aggregateMetrics(windowEvaluations, model);
      const byWindow = windowEvaluations
        .filter((evaluation) => evaluation.model === model)
        .map((evaluation) => ({
          windowIndex: evaluation.windowIndex,
          trainRange: `${seasonWeekLabel(evaluation.window.trainWindow.start)} -> ${seasonWeekLabel(evaluation.window.trainWindow.end)}`,
          testRange: `${seasonWeekLabel(evaluation.window.testWindow.start)} -> ${seasonWeekLabel(evaluation.window.testWindow.end)}`,
          metrics: evaluation.metrics,
        }));

      const topMisses = [...aggregated.predictions]
        .sort((left, right) => right.absoluteError - left.absoluteError)
        .slice(0, 5);

      return {
        model,
        overall: {
          overall: aggregated.overall,
          byPosition: aggregated.byPosition,
          byEventPresence: aggregated.byEventPresence,
        },
        byWindow,
        topMisses,
      };
    }),
  };
};
