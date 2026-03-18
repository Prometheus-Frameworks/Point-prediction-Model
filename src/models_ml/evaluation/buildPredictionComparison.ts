import type { ModelPredictionSet, PredictionComparisonRow } from '../types/prediction.js';

export const buildPredictionComparison = (predictionSets: ModelPredictionSet[]): PredictionComparisonRow[] => {
  const baselineMean = predictionSets.find((predictionSet) => predictionSet.model === 'baseline-mean');

  return predictionSets
    .map((predictionSet) => ({
      model: predictionSet.model,
      sampleSize: predictionSet.metrics.overall.sampleSize,
      mae: predictionSet.metrics.overall.mae,
      rmse: predictionSet.metrics.overall.rmse,
      correlation: predictionSet.metrics.overall.correlation,
      rankCorrelation: predictionSet.metrics.overall.rankCorrelation,
      maeDeltaVsBaselineMean: baselineMean
        ? predictionSet.metrics.overall.mae - baselineMean.metrics.overall.mae
        : null,
      rmseDeltaVsBaselineMean: baselineMean
        ? predictionSet.metrics.overall.rmse - baselineMean.metrics.overall.rmse
        : null,
    }))
    .sort((left, right) => left.mae - right.mae);
};
