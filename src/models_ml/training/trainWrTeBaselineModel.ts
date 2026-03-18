import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evaluatePredictions } from '../../datasets/evaluation/evaluatePredictions.js';
import type { PredictionRecord } from '../../datasets/types/metrics.js';
import type { WrTeLabeledRow } from '../../datasets/types/labeledRow.js';
import { defaultWrTeBaselineModelConfig, type WrTeBaselineModelConfig } from '../types/modelConfig.js';
import type {
  FeatureImportanceEntry,
  GradientBoostedTreeNode,
  WrTeBaselineModelArtifact,
} from '../types/modelArtifact.js';
import { prepareTrainingMatrix, vectorizeWrTeFeatureRow } from './prepareTrainingMatrix.js';

export interface TrainWrTeBaselineModelOptions {
  config?: Partial<WrTeBaselineModelConfig>;
  artifactOutputPath?: string;
  createdAt?: string;
}

export interface TrainWrTeBaselineModelResult {
  artifact: WrTeBaselineModelArtifact;
  predictions: PredictionRecord[];
}

interface SplitCandidate {
  featureIndex: number;
  threshold: number;
  gain: number;
  leftIndices: number[];
  rightIndices: number[];
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const sumSquaredError = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const mean = average(values);
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
};

const createLeaf = (targets: number[], l2Regularization: number): GradientBoostedTreeNode => ({
  type: 'leaf',
  value: targets.length === 0 ? 0 : (average(targets) * targets.length) / (targets.length + l2Regularization),
});

const fitBestSplit = (
  matrix: number[][],
  residuals: number[],
  indices: number[],
  config: WrTeBaselineModelConfig,
): SplitCandidate | null => {
  if (indices.length < config.minSamplesSplit) {
    return null;
  }

  const parentResiduals = indices.map((index) => residuals[index]);
  const parentLoss = sumSquaredError(parentResiduals);
  let best: SplitCandidate | null = null;

  for (let featureIndex = 0; featureIndex < matrix[0].length; featureIndex += 1) {
    const sorted = indices
      .map((index) => ({ index, value: matrix[index][featureIndex] }))
      .sort((left, right) => left.value - right.value);

    for (let splitIndex = config.minSamplesLeaf; splitIndex <= sorted.length - config.minSamplesLeaf; splitIndex += 1) {
      const currentValue = sorted[splitIndex - 1]?.value;
      const nextValue = sorted[splitIndex]?.value;
      if (currentValue === undefined || nextValue === undefined || currentValue === nextValue) {
        continue;
      }

      const threshold = (currentValue + nextValue) / 2;
      const leftIndices = sorted.slice(0, splitIndex).map((entry) => entry.index);
      const rightIndices = sorted.slice(splitIndex).map((entry) => entry.index);
      const gain =
        parentLoss -
        (sumSquaredError(leftIndices.map((index) => residuals[index])) +
          sumSquaredError(rightIndices.map((index) => residuals[index])));

      if (gain <= config.minGain) {
        continue;
      }

      if (!best || gain > best.gain) {
        best = {
          featureIndex,
          threshold,
          gain,
          leftIndices,
          rightIndices,
        };
      }
    }
  }

  return best;
};

const fitTree = (
  matrix: number[][],
  residuals: number[],
  indices: number[],
  depth: number,
  config: WrTeBaselineModelConfig,
): GradientBoostedTreeNode => {
  if (depth >= config.maxDepth || indices.length < config.minSamplesSplit) {
    return createLeaf(indices.map((index) => residuals[index]), config.l2Regularization);
  }

  const bestSplit = fitBestSplit(matrix, residuals, indices, config);
  if (!bestSplit) {
    return createLeaf(indices.map((index) => residuals[index]), config.l2Regularization);
  }

  return {
    type: 'split',
    featureIndex: bestSplit.featureIndex,
    threshold: bestSplit.threshold,
    gain: bestSplit.gain,
    left: fitTree(matrix, residuals, bestSplit.leftIndices, depth + 1, config),
    right: fitTree(matrix, residuals, bestSplit.rightIndices, depth + 1, config),
  };
};

const predictTree = (tree: GradientBoostedTreeNode, vector: number[]): number => {
  if (tree.type === 'leaf') {
    return tree.value;
  }

  return predictTree(vector[tree.featureIndex] <= tree.threshold ? tree.left : tree.right, vector);
};

const collectFeatureImportance = (
  node: GradientBoostedTreeNode,
  orderedFeatures: string[],
  acc: Map<string, FeatureImportanceEntry>,
): void => {
  if (node.type === 'leaf') {
    return;
  }

  const feature = orderedFeatures[node.featureIndex] ?? `feature_${node.featureIndex}`;
  const current = acc.get(feature) ?? { feature, splits: 0, gain: 0 };
  current.splits += 1;
  current.gain += node.gain;
  acc.set(feature, current);
  collectFeatureImportance(node.left, orderedFeatures, acc);
  collectFeatureImportance(node.right, orderedFeatures, acc);
};

const buildPredictionRecord = (
  row: WrTeLabeledRow,
  predicted: number,
): PredictionRecord => ({
  model: 'wrte-weekly-ppr-baseline',
  rowId: row.row_id,
  playerId: row.player_id,
  playerName: row.player_name,
  position: row.player_position,
  eventType: row.event_type,
  season: row.season,
  week: row.week,
  predicted,
  actual: row.target_fantasy_points_ppr,
  absoluteError: Math.abs(predicted - row.target_fantasy_points_ppr),
  squaredError: (predicted - row.target_fantasy_points_ppr) ** 2,
});

const buildConfig = (config?: Partial<WrTeBaselineModelConfig>): WrTeBaselineModelConfig => ({
  ...defaultWrTeBaselineModelConfig,
  ...config,
});

const uniqueNumbers = (values: number[]): number[] => [...new Set(values)].sort((left, right) => left - right);

export const trainWrTeBaselineModel = async (
  rows: WrTeLabeledRow[],
  options: TrainWrTeBaselineModelOptions = {},
): Promise<TrainWrTeBaselineModelResult> => {
  if (rows.length === 0) {
    throw new Error('Cannot train the WR/TE baseline model without labeled rows.');
  }

  const config = buildConfig(options.config);
  const matrix = prepareTrainingMatrix(rows);
  const predictions = new Array(matrix.targets.length).fill(average(matrix.targets));
  const initialPrediction = predictions[0] ?? 0;
  const trees: GradientBoostedTreeNode[] = [];

  for (let estimatorIndex = 0; estimatorIndex < config.nEstimators; estimatorIndex += 1) {
    const residuals = matrix.targets.map((target, index) => target - predictions[index]);
    const tree = fitTree(matrix.featureMatrix, residuals, matrix.featureMatrix.map((_, index) => index), 0, config);
    trees.push(tree);

    for (let rowIndex = 0; rowIndex < matrix.featureMatrix.length; rowIndex += 1) {
      predictions[rowIndex] += config.learningRate * predictTree(tree, matrix.featureMatrix[rowIndex]);
    }
  }

  const predictionRecords = rows.map((row, index) => buildPredictionRecord(row, predictions[index]));
  const featureImportanceMap = new Map<string, FeatureImportanceEntry>();
  const orderedFeatureNames = matrix.schema.orderedFeatures.map((feature) =>
    feature.kind === 'numeric' ? feature.column : `${feature.column}=${feature.category}`,
  );
  for (const tree of trees) {
    collectFeatureImportance(tree, orderedFeatureNames, featureImportanceMap);
  }

  const artifact: WrTeBaselineModelArtifact = {
    artifactVersion: 'wrte-baseline-model-v1',
    modelName: 'wrte-weekly-ppr-baseline',
    createdAt: options.createdAt ?? new Date().toISOString(),
    config,
    schema: matrix.schema,
    model: {
      initialPrediction,
      trees,
    },
    trainingMetadata: {
      sampleSize: rows.length,
      targetMean: average(matrix.targets),
      trainedPositions: [...new Set(rows.map((row) => row.player_position))].sort(),
      trainingSeasons: uniqueNumbers(rows.map((row) => row.season)),
      trainingWeeks: uniqueNumbers(rows.map((row) => row.week)),
    },
    featureImportance: [...featureImportanceMap.values()].sort((left, right) => right.gain - left.gain),
    evaluationSummary: {
      metrics: evaluatePredictions(predictionRecords),
    },
  };

  if (options.artifactOutputPath) {
    await mkdir(path.dirname(options.artifactOutputPath), { recursive: true });
    await writeFile(options.artifactOutputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  }

  return {
    artifact,
    predictions: predictionRecords,
  };
};

export const predictWithArtifact = (artifact: WrTeBaselineModelArtifact, row: WrTeLabeledRow): number => {
  const vector = vectorizeWrTeFeatureRow(row, artifact.schema);
  return artifact.model.trees.reduce(
    (prediction, tree) => prediction + artifact.config.learningRate * predictTree(tree, vector),
    artifact.model.initialPrediction,
  );
};
