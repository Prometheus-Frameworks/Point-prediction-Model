import { evaluatePredictions } from './evaluatePredictions.js';
import type { AggregatedMetricsSummary, PredictionRecord, WindowEvaluation } from '../types/metrics.js';

export const aggregateMetrics = (
  windowEvaluations: WindowEvaluation[],
  model: string,
): AggregatedMetricsSummary => {
  const predictions: PredictionRecord[] = windowEvaluations
    .filter((evaluation) => evaluation.model === model)
    .flatMap((evaluation) => evaluation.predictions);
  const grouped = evaluatePredictions(predictions);

  return {
    ...grouped,
    predictions,
  };
};
