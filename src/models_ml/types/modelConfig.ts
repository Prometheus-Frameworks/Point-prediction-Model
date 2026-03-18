export interface WrTeBaselineModelConfig {
  modelFamily: 'gbrt';
  objective: 'regression-ppr';
  targetColumn: 'target_fantasy_points_ppr';
  maxDepth: number;
  nEstimators: number;
  learningRate: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  l2Regularization: number;
  minGain: number;
  randomSeed: number;
}

export const defaultWrTeBaselineModelConfig: WrTeBaselineModelConfig = {
  modelFamily: 'gbrt',
  objective: 'regression-ppr',
  targetColumn: 'target_fantasy_points_ppr',
  maxDepth: 2,
  nEstimators: 24,
  learningRate: 0.12,
  minSamplesSplit: 4,
  minSamplesLeaf: 2,
  l2Regularization: 1,
  minGain: 1e-6,
  randomSeed: 7,
};
