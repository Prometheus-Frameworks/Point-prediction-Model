import type { CalibrationBucketRow, CalibrationReport } from '../types/uncertainty.js';

export const buildReliabilityReport = (buckets: CalibrationBucketRow[]): CalibrationReport['reliability'] => {
  const worstBucket = buckets.reduce<CalibrationBucketRow | null>((currentWorst, bucket) => {
    if (!currentWorst || Math.abs(bucket.bias) > Math.abs(currentWorst.bias)) {
      return bucket;
    }

    return currentWorst;
  }, null);

  const meanAbsoluteBucketBias = buckets.length === 0
    ? 0
    : buckets.reduce((sum, bucket) => sum + Math.abs(bucket.bias), 0) / buckets.length;

  const notes: string[] = [];
  if (worstBucket && Math.abs(worstBucket.bias) > 3) {
    notes.push(`Largest bucket bias is ${worstBucket.bias.toFixed(2)} in ${worstBucket.bucketId}.`);
  }
  if (buckets.some((bucket) => bucket.coverage90 !== null && bucket.coverage90 < 0.8)) {
    notes.push('Some buckets materially under-cover the nominal 90% interval.');
  }
  if (notes.length === 0) {
    notes.push('Bucket-level calibration is within expected bounds for the available sample.');
  }

  return {
    meanAbsoluteBucketBias,
    worstBucket,
    notes,
  };
};
