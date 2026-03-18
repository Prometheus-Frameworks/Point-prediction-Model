import type { GroupedMetrics, PredictionRecord } from '../types/metrics.js';
import type { WrTeLabeledRow } from '../types/labeledRow.js';

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const pearsonCorrelation = (pairs: Array<{ predicted: number; actual: number }>): number | null => {
  if (pairs.length < 2) {
    return null;
  }

  const predictedMean = average(pairs.map((pair) => pair.predicted));
  const actualMean = average(pairs.map((pair) => pair.actual));
  let covariance = 0;
  let predictedVariance = 0;
  let actualVariance = 0;

  for (const pair of pairs) {
    const predictedDiff = pair.predicted - predictedMean;
    const actualDiff = pair.actual - actualMean;
    covariance += predictedDiff * actualDiff;
    predictedVariance += predictedDiff ** 2;
    actualVariance += actualDiff ** 2;
  }

  if (predictedVariance === 0 || actualVariance === 0) {
    return null;
  }

  return covariance / Math.sqrt(predictedVariance * actualVariance);
};

const rankValues = (values: number[]): number[] =>
  values
    .map((value, index) => ({ value, index }))
    .sort((left, right) => left.value - right.value)
    .reduce<number[]>((acc, entry, rank) => {
      acc[entry.index] = rank + 1;
      return acc;
    }, []);

const summarize = (predictions: PredictionRecord[]) => {
  if (predictions.length === 0) {
    return {
      sampleSize: 0,
      mae: 0,
      rmse: 0,
      correlation: null,
      rankCorrelation: null,
    };
  }

  const mae = average(predictions.map((prediction) => prediction.absoluteError));
  const rmse = Math.sqrt(average(predictions.map((prediction) => prediction.squaredError)));
  const correlation = pearsonCorrelation(predictions);
  const predictedRanks = rankValues(predictions.map((prediction) => prediction.predicted));
  const actualRanks = rankValues(predictions.map((prediction) => prediction.actual));
  const rankCorrelation = pearsonCorrelation(
    predictedRanks.map((predicted, index) => ({ predicted, actual: actualRanks[index] })),
  );

  return {
    sampleSize: predictions.length,
    mae,
    rmse,
    correlation,
    rankCorrelation,
  };
};

export const evaluatePredictions = (predictions: PredictionRecord[]): GroupedMetrics => {
  const byPosition = predictions.reduce<Partial<Record<WrTeLabeledRow['player_position'], PredictionRecord[]>>>(
    (acc, prediction) => {
      acc[prediction.position] ??= [];
      acc[prediction.position]?.push(prediction);
      return acc;
    },
    {},
  );

  return {
    overall: summarize(predictions),
    byPosition: Object.fromEntries(
      Object.entries(byPosition).map(([position, entries]) => [position, summarize(entries)]),
    ) as GroupedMetrics['byPosition'],
    byEventPresence: {
      withEvent: summarize(predictions.filter((prediction) => prediction.eventType !== 'NONE')),
      withoutEvent: summarize(predictions.filter((prediction) => prediction.eventType === 'NONE')),
    },
  };
};
