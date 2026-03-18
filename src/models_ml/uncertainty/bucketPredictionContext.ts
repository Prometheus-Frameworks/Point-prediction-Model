import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { PredictionContextBucket, PredictionTier, SampleTier } from '../types/uncertainty.js';

const getPredictionTier = (pointPrediction: number): PredictionTier => {
  if (pointPrediction < 9) {
    return 'low';
  }

  if (pointPrediction < 15) {
    return 'mid';
  }

  return 'high';
};

const getSampleTier = (row: WrTeFeatureRow): SampleTier => {
  const reliability = row.player_sample_reliability;
  const games = row.player_baseline_games;

  if (reliability < 0.45 || games < 4) {
    return 'low';
  }

  if (reliability < 0.7 || games < 8) {
    return 'medium';
  }

  return 'high';
};

const formatBucketId = (parts: string[]): string => parts.join('|');

export const bucketPredictionContext = (
  row: WrTeFeatureRow,
  pointPrediction: number,
): PredictionContextBucket => {
  const predictionTier = getPredictionTier(pointPrediction);
  const eventBucket = row.event_type === 'NONE' ? 'non-event' : 'event';
  const sampleTier = getSampleTier(row);
  const experienceTier = row.player_is_rookie >= 1 ? 'rookie' : 'veteran';

  const fullParts = [
    `position:${row.player_position}`,
    `prediction:${predictionTier}`,
    `event:${eventBucket}`,
    `sample:${sampleTier}`,
    `experience:${experienceTier}`,
  ];

  return {
    bucketId: formatBucketId(fullParts),
    position: row.player_position,
    predictionTier,
    eventBucket,
    sampleTier,
    experienceTier,
    fallbackBucketIds: [
      formatBucketId(fullParts.slice(0, 4)),
      formatBucketId([fullParts[0], fullParts[1], fullParts[2]]),
      formatBucketId([fullParts[0], fullParts[2]]),
      formatBucketId([fullParts[0]]),
      'global',
    ],
  };
};
