import type { GroupedMetrics } from '../../datasets/types/metrics.js';
import type { WrTeBaselineModelConfig } from './modelConfig.js';
import type { WrTeBaselineUncertaintyArtifact } from './uncertainty.js';

export interface NumericFeatureSpec {
  column: string;
  kind: 'numeric';
  imputationValue: number;
}

export interface OneHotFeatureSpec {
  column: string;
  kind: 'one-hot';
  category: string;
}

export type ModelFeatureSpec = NumericFeatureSpec | OneHotFeatureSpec;

export interface ModelSchema {
  featureSchemaVersion: 'wrte-weekly-v1';
  orderedFeatures: ModelFeatureSpec[];
  categoricalColumns: string[];
  supportedPositions: Array<'WR' | 'TE'>;
}

export interface GradientBoostedTreeLeafNode {
  type: 'leaf';
  value: number;
}

export interface GradientBoostedTreeSplitNode {
  type: 'split';
  featureIndex: number;
  threshold: number;
  gain: number;
  left: GradientBoostedTreeNode;
  right: GradientBoostedTreeNode;
}

export type GradientBoostedTreeNode = GradientBoostedTreeLeafNode | GradientBoostedTreeSplitNode;

export interface FeatureImportanceEntry {
  feature: string;
  splits: number;
  gain: number;
}

export interface TrainingEvaluationSummary {
  metrics: GroupedMetrics;
  benchmarkComparisons?: Array<{
    model: string;
    mae: number;
    rmse: number;
    correlation: number | null;
    rankCorrelation: number | null;
  }>;
}

export interface WrTeBaselineModelArtifact {
  artifactVersion: 'wrte-baseline-model-v1';
  modelName: 'wrte-weekly-ppr-baseline';
  createdAt: string;
  config: WrTeBaselineModelConfig;
  schema: ModelSchema;
  model: {
    initialPrediction: number;
    trees: GradientBoostedTreeNode[];
  };
  trainingMetadata: {
    sampleSize: number;
    targetMean: number;
    trainedPositions: Array<'WR' | 'TE'>;
    trainingSeasons: number[];
    trainingWeeks: number[];
  };
  featureImportance: FeatureImportanceEntry[];
  evaluationSummary?: TrainingEvaluationSummary;
  uncertaintyMetadata?: WrTeBaselineUncertaintyArtifact;
}
