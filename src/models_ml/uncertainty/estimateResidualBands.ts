import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import { average, quantile, rootMeanSquare } from '../../utils/math.js';
import { bucketPredictionContext } from './bucketPredictionContext.js';
import type {
  ResidualBucketDefinition,
  ResidualObservation,
  WrTeBaselineUncertaintyArtifact,
} from '../types/uncertainty.js';

export interface ResidualBandInput {
  row: WrTeFeatureRow;
  actual: number;
  pointPrediction: number;
}

export interface EstimateResidualBandsOptions {
  generatedAt?: string;
  minimumBucketSize?: number;
}

const toResidualObservation = ({ row, actual, pointPrediction }: ResidualBandInput): ResidualObservation => {
  const residual = actual - pointPrediction;

  return {
    rowId: 'row_id' in row ? String(row.row_id) : row.scenario_id,
    playerId: row.player_id,
    playerName: row.player_name,
    season: row.season,
    week: row.week,
    position: row.player_position,
    eventType: row.event_type,
    actual,
    pointPrediction,
    residual,
    absoluteResidual: Math.abs(residual),
    context: bucketPredictionContext(row, pointPrediction),
  };
};

const buildBucketDefinition = (
  bucketId: string,
  observations: ResidualObservation[],
): ResidualBucketDefinition => {
  const residuals = observations.map((observation) => observation.residual);
  const absoluteResiduals = observations.map((observation) => observation.absoluteResidual);
  const dimensions = bucketId === 'global' ? ['global'] : bucketId.split('|').map((part) => part.split(':')[0] ?? part);

  return {
    bucketId,
    label: bucketId,
    dimensions,
    sampleSize: observations.length,
    meanResidual: average(residuals),
    mae: average(absoluteResiduals),
    rmse: rootMeanSquare(residuals),
    absoluteResidualP50: quantile(absoluteResiduals, 0.5),
    quantiles: {
      lower50: quantile(residuals, 0.25),
      upper50: quantile(residuals, 0.75),
      lower80: quantile(residuals, 0.1),
      upper80: quantile(residuals, 0.9),
      lower90: quantile(residuals, 0.05),
      upper90: quantile(residuals, 0.95),
    },
  };
};

export const estimateResidualBands = (
  inputs: ResidualBandInput[],
  options: EstimateResidualBandsOptions = {},
): WrTeBaselineUncertaintyArtifact => {
  if (inputs.length === 0) {
    throw new Error('Cannot estimate residual bands without historical predictions.');
  }

  const observations = inputs.map(toResidualObservation);
  const bucketMap = new Map<string, ResidualObservation[]>();

  const append = (bucketId: string, observation: ResidualObservation): void => {
    const current = bucketMap.get(bucketId) ?? [];
    current.push(observation);
    bucketMap.set(bucketId, current);
  };

  for (const observation of observations) {
    append(observation.context.bucketId, observation);
    for (const fallbackBucketId of observation.context.fallbackBucketIds) {
      append(fallbackBucketId, observation);
    }
  }

  const residualBucketDefinitions = [...bucketMap.entries()]
    .map(([bucketId, bucketObservations]) => buildBucketDefinition(bucketId, bucketObservations))
    .sort((left, right) => right.sampleSize - left.sampleSize || left.bucketId.localeCompare(right.bucketId));

  const globalBucket = residualBucketDefinitions.find((definition) => definition.bucketId === 'global');
  if (!globalBucket) {
    throw new Error('Residual bucket estimation failed to create a global fallback bucket.');
  }

  return {
    artifactVersion: 'wrte-baseline-uncertainty-v1',
    modelName: 'wrte-weekly-ppr-baseline',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    intervalMethod: 'residual-empirical-v1',
    minimumBucketSize: options.minimumBucketSize ?? 5,
    bucketDimensions: ['position', 'predictionTier', 'eventBucket', 'sampleTier', 'experienceTier'],
    globalBucketId: globalBucket.bucketId,
    residualBucketDefinitions,
  };
};
