import type { WrTeFeatureRow } from '../../features/types/featureRow.js';

export type PredictionTier = 'low' | 'mid' | 'high';
export type SampleTier = 'low' | 'medium' | 'high';
export type ExperienceTier = 'rookie' | 'veteran';
export type EventBucket = 'event' | 'non-event';

export interface PredictionContextBucket {
  bucketId: string;
  position: WrTeFeatureRow['player_position'];
  predictionTier: PredictionTier;
  eventBucket: EventBucket;
  sampleTier: SampleTier;
  experienceTier: ExperienceTier;
  fallbackBucketIds: string[];
}

export interface ResidualObservation {
  rowId: string;
  playerId: string;
  playerName: string;
  season: number;
  week: number;
  position: WrTeFeatureRow['player_position'];
  eventType: WrTeFeatureRow['event_type'];
  actual: number;
  pointPrediction: number;
  residual: number;
  absoluteResidual: number;
  context: PredictionContextBucket;
}

export interface ResidualIntervalQuantiles {
  lower50: number;
  upper50: number;
  lower80: number;
  upper80: number;
  lower90: number;
  upper90: number;
}

export interface ResidualBucketDefinition {
  bucketId: string;
  label: string;
  dimensions: string[];
  sampleSize: number;
  meanResidual: number;
  mae: number;
  rmse: number;
  absoluteResidualP50: number;
  quantiles: ResidualIntervalQuantiles;
}

export interface CalibrationSummaryMetadata {
  sampleSize: number;
  overallBias: number;
  overallMae: number;
  overallRmse: number;
  coverage50: number | null;
  coverage80: number | null;
  coverage90: number | null;
}

export interface WrTeBaselineUncertaintyArtifact {
  artifactVersion: 'wrte-baseline-uncertainty-v1';
  modelName: 'wrte-weekly-ppr-baseline';
  generatedAt: string;
  intervalMethod: 'residual-empirical-v1';
  minimumBucketSize: number;
  bucketDimensions: string[];
  globalBucketId: string;
  residualBucketDefinitions: ResidualBucketDefinition[];
  calibrationSummary?: CalibrationSummaryMetadata;
}

export interface IntervalPrediction {
  pointPrediction: number;
  lower50: number;
  upper50: number;
  lower80: number;
  upper80: number;
  lower90: number;
  upper90: number;
  uncertaintyBucket: string;
  intervalMethod: 'residual-empirical-v1';
}

export interface CalibrationBucketRow {
  bucketId: string;
  sampleSize: number;
  averagePrediction: number;
  averageActual: number;
  bias: number;
  mae: number;
  rmse: number;
  coverage50: number | null;
  coverage80: number | null;
  coverage90: number | null;
}

export interface CalibrationReport {
  generatedAt: string;
  sampleSize: number;
  intervalMethod: 'residual-empirical-v1';
  overall: CalibrationSummaryMetadata;
  buckets: CalibrationBucketRow[];
  reliability: {
    meanAbsoluteBucketBias: number;
    worstBucket: CalibrationBucketRow | null;
    notes: string[];
  };
}

export interface SubgroupDefinition {
  key: string;
  label: string;
  matches: (row: WrTeFeatureRow) => boolean;
}

export interface SubgroupFamilyDefinition {
  family: string;
  label: string;
  groups: SubgroupDefinition[];
}

export interface SubgroupStabilityRow {
  family: string;
  subgroup: string;
  label: string;
  sampleSize: number;
  averagePrediction: number;
  averageActual: number;
  bias: number;
  mae: number;
  rmse: number;
  coverage50: number | null;
  coverage80: number | null;
  coverage90: number | null;
}

export interface SubgroupStabilityReport {
  generatedAt: string;
  sampleSize: number;
  intervalMethod: 'residual-empirical-v1';
  groups: SubgroupStabilityRow[];
}
