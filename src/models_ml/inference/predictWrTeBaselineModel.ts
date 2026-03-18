import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeBaselinePrediction } from '../types/prediction.js';
import type { WrTeBaselineModelArtifact } from '../types/modelArtifact.js';
import { vectorizeWrTeFeatureRow } from '../training/prepareTrainingMatrix.js';

const predictTree = (node: WrTeBaselineModelArtifact['model']['trees'][number], vector: number[]): number => {
  if (node.type === 'leaf') {
    return node.value;
  }

  return predictTree(vector[node.featureIndex] <= node.threshold ? node.left : node.right, vector);
};

export const predictWrTeBaselineModelValue = (
  artifact: WrTeBaselineModelArtifact,
  row: WrTeFeatureRow,
): number => {
  const vector = vectorizeWrTeFeatureRow(row, artifact.schema);
  return artifact.model.trees.reduce(
    (prediction, tree) => prediction + artifact.config.learningRate * predictTree(tree, vector),
    artifact.model.initialPrediction,
  );
};

export const predictWrTeBaselineModel = (
  artifact: WrTeBaselineModelArtifact,
  rows: WrTeFeatureRow[],
): WrTeBaselinePrediction[] =>
  rows.map((row) => ({
    rowId: 'row_id' in row ? String(row.row_id) : row.scenario_id,
    playerId: row.player_id,
    playerName: row.player_name,
    position: row.player_position,
    predictedPpr: predictWrTeBaselineModelValue(artifact, row),
  }));
