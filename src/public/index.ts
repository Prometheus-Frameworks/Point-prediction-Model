export { buildScenarios } from '../services/buildScenariosService.js';
export { buildHistoricalDatasetService } from '../services/buildHistoricalDatasetService.js';
export { buildFeatureBatchService } from '../services/buildFeatureBatchService.js';
export { buildFeatureRowService } from '../services/buildFeatureRowService.js';
export { ingestRawEvents } from '../services/ingestRawEventsService.js';
export { projectBatch } from '../services/projectBatchService.js';
export { projectFromRawEvents } from '../services/projectFromRawEventsService.js';
export { projectScenario } from '../services/projectScenarioService.js';
export { runBacktestService } from '../services/runBacktestService.js';
export { trainBaselineModelService } from '../services/trainBaselineModelService.js';
export { predictBaselineModelService } from '../services/predictBaselineModelService.js';
export { runModelBacktestService } from '../services/runModelBacktestService.js';
export type {
  BuildFeatureBatchOutput,
  BuildHistoricalDatasetOutput,
  BuildHistoricalDatasetResult,
  BuildFeatureBatchResult,
  BuildFeatureRowOutput,
  BuildFeatureRowResult,
  BuildScenariosOutput,
  BuildScenariosResult,
  IngestRawEventsOutput,
  IngestRawEventsResult,
  ProjectBatchOutput,
  ProjectBatchResult,
  ProjectFromRawEventsOutput,
  ProjectFromRawEventsResult,
  ProjectScenarioOutput,
  ProjectScenarioResult,
  RunBacktestOutput,
  RunBacktestResult,
  TrainBaselineModelOutput,
  TrainBaselineModelResult,
  PredictBaselineModelOutput,
  PredictBaselineModelResult,
  RunModelBacktestOutput,
  RunModelBacktestResult,
  ServiceError,
  ServiceResult,
  ServiceWarning,
} from '../services/types.js';
export type { RawEvent } from '../ingestion/types/rawEvent.js';
export type { NormalizedEvent } from '../ingestion/types/normalizedEvent.js';
export type { ScenarioRunResult } from '../models/scenarios/runScenario.js';
export type { ProjectionScenario } from '../types/scenario.js';

export { buildFeatureRow } from '../features/builders/buildFeatureRow.js';
export { validateFeatureRow, FeatureRowValidationError } from '../features/validation/validateFeatureRow.js';
export { wrTeFeatureSchema } from '../features/schema/wrTeFeatureSchema.js';
export { sampleFeatureInputs } from '../features/examples/sampleFeatureInputs.js';
export { sampleFeatureRows } from '../features/examples/sampleFeatureRows.js';
export type { WrTeFeatureRow } from '../features/types/featureRow.js';
export type { WrTeFeatureSourceInput, FeatureWindowSummary } from '../features/types/sourceTypes.js';

export { buildLabeledRow } from '../datasets/builders/buildLabeledRow.js';
export { buildHistoricalDataset } from '../datasets/builders/buildHistoricalDataset.js';
export { timeSeriesSplit } from '../datasets/splits/timeSeriesSplit.js';
export { rollingBacktestWindows } from '../datasets/splits/rollingBacktestWindows.js';
export { baselineMeanModel } from '../datasets/benchmarks/baselineMeanModel.js';
export { baselineRecentTrendModel } from '../datasets/benchmarks/baselineRecentTrendModel.js';
export { baselineUsageModel } from '../datasets/benchmarks/baselineUsageModel.js';
export { evaluatePredictions } from '../datasets/evaluation/evaluatePredictions.js';
export { aggregateMetrics } from '../datasets/evaluation/aggregateMetrics.js';
export { generateBacktestReport } from '../datasets/evaluation/generateBacktestReport.js';
export { historicalSampleInputs } from '../datasets/examples/historicalSampleInputs.js';
export { historicalSampleDataset } from '../datasets/examples/historicalSampleDataset.js';
export type { HistoricalLabeledRowInput, HistoricalRowMetadata, WeeklyPprTarget, WrTeLabeledRow } from '../datasets/types/labeledRow.js';
export type { BacktestReport, BacktestModelReport, EvaluationMetrics, GroupedMetrics, PredictionRecord, WindowEvaluation } from '../datasets/types/metrics.js';
export type { RollingBacktestConfig, RollingBacktestWindow, SeasonWeek, SplitTimeWindow, TimeSeriesSplitConfig, TimeSeriesSplitResult } from '../datasets/types/split.js';

export { prepareTrainingMatrix, vectorizeWrTeFeatureRow } from '../models_ml/training/prepareTrainingMatrix.js';
export { trainWrTeBaselineModel } from '../models_ml/training/trainWrTeBaselineModel.js';
export { loadModelArtifact } from '../models_ml/inference/loadModelArtifact.js';
export { predictWrTeBaselineModel, predictWrTeBaselineModelValue } from '../models_ml/inference/predictWrTeBaselineModel.js';
export { evaluateModelAgainstBenchmarks } from '../models_ml/evaluation/evaluateModelAgainstBenchmarks.js';
export { buildPredictionComparison } from '../models_ml/evaluation/buildPredictionComparison.js';
export type { WrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
export { defaultWrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
export type { WrTeBaselineModelArtifact, ModelSchema, ModelFeatureSpec, FeatureImportanceEntry } from '../models_ml/types/modelArtifact.js';
export type { WrTeBaselinePrediction, ModelPredictionSet, PredictionComparisonRow } from '../models_ml/types/prediction.js';
