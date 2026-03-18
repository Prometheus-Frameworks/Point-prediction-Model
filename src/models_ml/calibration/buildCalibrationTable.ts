import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import { average, rootMeanSquare } from '../../utils/math.js';
import { assignPredictionInterval } from '../uncertainty/assignPredictionInterval.js';
import { bucketPredictionContext } from '../uncertainty/bucketPredictionContext.js';
import type { CalibrationBucketRow, WrTeBaselineUncertaintyArtifact } from '../types/uncertainty.js';

export interface CalibrationInput {
  row: WrTeFeatureRow;
  actual: number;
  pointPrediction: number;
}

interface EnrichedCalibrationInput extends CalibrationInput {
  bucketId: string;
  residual: number;
  absoluteError: number;
  squaredError: number;
  coverage50: boolean | null;
  coverage80: boolean | null;
  coverage90: boolean | null;
}

const withCoverage = (
  input: CalibrationInput,
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact,
): EnrichedCalibrationInput => {
  const context = bucketPredictionContext(input.row, input.pointPrediction);
  const interval = uncertaintyArtifact ? assignPredictionInterval(uncertaintyArtifact, input.row, input.pointPrediction) : null;

  return {
    ...input,
    bucketId: `${input.row.player_position}|prediction:${context.predictionTier}`,
    residual: input.actual - input.pointPrediction,
    absoluteError: Math.abs(input.actual - input.pointPrediction),
    squaredError: (input.actual - input.pointPrediction) ** 2,
    coverage50: interval ? input.actual >= interval.lower50 && input.actual <= interval.upper50 : null,
    coverage80: interval ? input.actual >= interval.lower80 && input.actual <= interval.upper80 : null,
    coverage90: interval ? input.actual >= interval.lower90 && input.actual <= interval.upper90 : null,
  };
};

const averageBoolean = (values: Array<boolean | null>): number | null => {
  const defined = values.filter((value): value is boolean => value !== null);
  if (defined.length === 0) {
    return null;
  }

  return defined.filter(Boolean).length / defined.length;
};

export const buildCalibrationTable = (
  inputs: CalibrationInput[],
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact,
): CalibrationBucketRow[] => {
  const enriched = inputs.map((input) => withCoverage(input, uncertaintyArtifact));
  const bucketMap = new Map<string, EnrichedCalibrationInput[]>();

  for (const entry of enriched) {
    const current = bucketMap.get(entry.bucketId) ?? [];
    current.push(entry);
    bucketMap.set(entry.bucketId, current);
  }

  return [...bucketMap.entries()]
    .map(([bucketId, entries]) => ({
      bucketId,
      sampleSize: entries.length,
      averagePrediction: average(entries.map((entry) => entry.pointPrediction)),
      averageActual: average(entries.map((entry) => entry.actual)),
      bias: average(entries.map((entry) => entry.residual)),
      mae: average(entries.map((entry) => entry.absoluteError)),
      rmse: rootMeanSquare(entries.map((entry) => Math.sqrt(entry.squaredError))),
      coverage50: averageBoolean(entries.map((entry) => entry.coverage50)),
      coverage80: averageBoolean(entries.map((entry) => entry.coverage80)),
      coverage90: averageBoolean(entries.map((entry) => entry.coverage90)),
    }))
    .sort((left, right) => left.averagePrediction - right.averagePrediction || left.bucketId.localeCompare(right.bucketId));
};
