import { baselineMeanModel } from '../../datasets/benchmarks/baselineMeanModel.js';
import { baselineRecentTrendModel } from '../../datasets/benchmarks/baselineRecentTrendModel.js';
import { baselineUsageModel } from '../../datasets/benchmarks/baselineUsageModel.js';
import { evaluatePredictions } from '../../datasets/evaluation/evaluatePredictions.js';
import type { PredictionRecord } from '../../datasets/types/metrics.js';
import type { WrTeLabeledRow } from '../../datasets/types/labeledRow.js';
import { predictWrTeBaselineModelValue } from '../inference/predictWrTeBaselineModel.js';
import { buildPredictionComparison } from './buildPredictionComparison.js';
import { trainWrTeBaselineModel, type TrainWrTeBaselineModelOptions } from '../training/trainWrTeBaselineModel.js';
import type { ModelPredictionSet, PredictionComparisonRow } from '../types/prediction.js';
import type { WrTeBaselineModelArtifact } from '../types/modelArtifact.js';

export interface EvaluateModelAgainstBenchmarksResult {
  artifact: WrTeBaselineModelArtifact;
  models: ModelPredictionSet[];
  comparison: PredictionComparisonRow[];
}

const toPredictionRecord = (model: string, row: WrTeLabeledRow, predicted: number): PredictionRecord => ({
  model,
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

export const evaluateModelAgainstBenchmarks = async (
  trainRows: WrTeLabeledRow[],
  testRows: WrTeLabeledRow[],
  options: TrainWrTeBaselineModelOptions = {},
): Promise<EvaluateModelAgainstBenchmarksResult> => {
  const trainingResult = await trainWrTeBaselineModel(trainRows, options);
  const learnedModelPredictions = testRows.map((row) =>
    toPredictionRecord('wrte-weekly-ppr-baseline', row, predictWrTeBaselineModelValue(trainingResult.artifact, row)),
  );

  const benchmarkModels = [
    baselineMeanModel(trainRows),
    baselineRecentTrendModel(trainRows),
    baselineUsageModel(trainRows),
  ];

  const models: ModelPredictionSet[] = [
    {
      model: 'wrte-weekly-ppr-baseline',
      predictions: learnedModelPredictions,
      metrics: evaluatePredictions(learnedModelPredictions),
    },
    ...benchmarkModels.map((model) => {
      const predictions = testRows.map((row) => toPredictionRecord(model.name, row, model.predict(row)));
      return {
        model: model.name,
        predictions,
        metrics: evaluatePredictions(predictions),
      };
    }),
  ];

  trainingResult.artifact.evaluationSummary = {
    metrics: evaluatePredictions(trainingResult.predictions),
    benchmarkComparisons: models.map((model) => ({
      model: model.model,
      mae: model.metrics.overall.mae,
      rmse: model.metrics.overall.rmse,
      correlation: model.metrics.overall.correlation,
      rankCorrelation: model.metrics.overall.rankCorrelation,
    })),
  };

  return {
    artifact: trainingResult.artifact,
    models,
    comparison: buildPredictionComparison(models),
  };
};
