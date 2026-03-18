import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import { clamp } from '../../utils/math.js';
import { bucketPredictionContext } from './bucketPredictionContext.js';
import type { IntervalPrediction, ResidualBucketDefinition, WrTeBaselineUncertaintyArtifact } from '../types/uncertainty.js';

const findBucketDefinition = (
  artifact: WrTeBaselineUncertaintyArtifact,
  bucketId: string,
): ResidualBucketDefinition | undefined => artifact.residualBucketDefinitions.find((definition) => definition.bucketId === bucketId);

export const assignPredictionInterval = (
  artifact: WrTeBaselineUncertaintyArtifact,
  row: WrTeFeatureRow,
  pointPrediction: number,
): IntervalPrediction => {
  const context = bucketPredictionContext(row, pointPrediction);
  const candidateBucketIds = [context.bucketId, ...context.fallbackBucketIds];
  const bucket = candidateBucketIds
    .map((bucketId) => findBucketDefinition(artifact, bucketId))
    .find((definition) => definition && definition.sampleSize >= artifact.minimumBucketSize)
    ?? findBucketDefinition(artifact, artifact.globalBucketId);

  if (!bucket) {
    throw new Error('Unable to assign prediction interval without a residual bucket definition.');
  }

  const lower50 = Math.max(0, pointPrediction + bucket.quantiles.lower50);
  const upper50 = Math.max(lower50, pointPrediction + bucket.quantiles.upper50);
  const lower80 = Math.max(0, Math.min(lower50, pointPrediction + bucket.quantiles.lower80));
  const upper80 = Math.max(upper50, pointPrediction + bucket.quantiles.upper80);
  const lower90 = Math.max(0, Math.min(lower80, pointPrediction + bucket.quantiles.lower90));
  const upper90 = Math.max(upper80, pointPrediction + bucket.quantiles.upper90);

  return {
    pointPrediction,
    lower50: clamp(lower50, 0, Number.MAX_SAFE_INTEGER),
    upper50: clamp(upper50, 0, Number.MAX_SAFE_INTEGER),
    lower80: clamp(lower80, 0, Number.MAX_SAFE_INTEGER),
    upper80: clamp(upper80, 0, Number.MAX_SAFE_INTEGER),
    lower90: clamp(lower90, 0, Number.MAX_SAFE_INTEGER),
    upper90: clamp(upper90, 0, Number.MAX_SAFE_INTEGER),
    uncertaintyBucket: bucket.bucketId,
    intervalMethod: artifact.intervalMethod,
  };
};
