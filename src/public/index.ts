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
export { predictWithIntervalsService } from '../services/predictWithIntervalsService.js';
export { runFusedProjectionService } from '../services/runFusedProjectionService.js';
export { runFusedBatchService } from '../services/runFusedBatchService.js';
export { evaluateCalibrationService } from '../services/evaluateCalibrationService.js';
export { evaluateSubgroupStabilityService } from '../services/evaluateSubgroupStabilityService.js';
export { runProjectionDiagnosticsService } from '../services/runProjectionDiagnosticsService.js';
export { scoreRegressionCandidatesService, scoreRegressionCandidates, buildProjectionDiagnostic } from '../services/scoreRegressionCandidatesService.js';
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
  EvaluateCalibrationOutput,
  EvaluateCalibrationResult,
  EvaluateSubgroupStabilityOutput,
  EvaluateSubgroupStabilityResult,
  RunProjectionDiagnosticsEnvelope,
  RunProjectionDiagnosticsResult,
  ScoreRegressionCandidatesEnvelope,
  ScoreRegressionCandidatesResult,
  RunFusedProjectionOutput,
  RunFusedProjectionResult,
  RunFusedBatchOutput,
  RunFusedBatchResult,
  ServiceError,
  ServiceResult,
  ServiceWarning,
} from '../services/types.js';
export type { RawEvent } from '../ingestion/types/rawEvent.js';
export type { NormalizedEvent } from '../ingestion/types/normalizedEvent.js';
export { runScenario } from '../models/scenarios/runScenario.js';
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
export { bucketPredictionContext } from '../models_ml/uncertainty/bucketPredictionContext.js';
export { estimateResidualBands } from '../models_ml/uncertainty/estimateResidualBands.js';
export { assignPredictionInterval } from '../models_ml/uncertainty/assignPredictionInterval.js';
export { buildCalibrationTable } from '../models_ml/calibration/buildCalibrationTable.js';
export { buildReliabilityReport } from '../models_ml/calibration/buildReliabilityReport.js';
export { evaluateCalibration } from '../models_ml/calibration/evaluateCalibration.js';
export { subgroupDefinitions } from '../models_ml/subgroup/subgroupDefinitions.js';
export { evaluateSubgroupStability } from '../models_ml/subgroup/evaluateSubgroupStability.js';
export { evaluateModelAgainstBenchmarks } from '../models_ml/evaluation/evaluateModelAgainstBenchmarks.js';
export { buildPredictionComparison } from '../models_ml/evaluation/buildPredictionComparison.js';
export type { WrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
export { defaultWrTeBaselineModelConfig } from '../models_ml/types/modelConfig.js';
export type { WrTeBaselineModelArtifact, ModelSchema, ModelFeatureSpec, FeatureImportanceEntry } from '../models_ml/types/modelArtifact.js';
export type { WrTeBaselinePrediction, ModelPredictionSet, PredictionComparisonRow } from '../models_ml/types/prediction.js';
export type {
  PredictionContextBucket,
  ResidualBucketDefinition,
  WrTeBaselineUncertaintyArtifact,
  IntervalPrediction,
  CalibrationBucketRow,
  CalibrationReport,
  SubgroupFamilyDefinition,
  SubgroupStabilityRow,
  SubgroupStabilityReport,
} from '../models_ml/types/uncertainty.js';

export { scoreUsageProductionGap } from '../diagnostics/scoring/scoreUsageProductionGap.js';
export { scoreEfficiencyFragility } from '../diagnostics/scoring/scoreEfficiencyFragility.js';
export { scoreTdRegressionRisk } from '../diagnostics/scoring/scoreTdRegressionRisk.js';
export { scoreVolumeStability } from '../diagnostics/scoring/scoreVolumeStability.js';
export { scoreProjectionStickiness } from '../diagnostics/scoring/scoreProjectionStickiness.js';
export { combineRegressionScores } from '../diagnostics/scoring/combineRegressionScores.js';
export { buildDiagnosticFlags } from '../diagnostics/explain/buildDiagnosticFlags.js';
export { buildRegressionExplanation } from '../diagnostics/explain/buildRegressionExplanation.js';
export type {
  ProjectionDiagnosticInput,
  RegressionDiagnosticFlag,
  UsageProductionGapScore,
  EfficiencyFragilityScore,
  TdRegressionRiskScore,
  VolumeStabilityScore,
  ProjectionStickinessScore,
  RegressionComponentScores,
  CombinedRegressionScores,
} from '../diagnostics/types/regressionSignal.js';
export type {
  ProjectionDiagnosticOutput,
  ProjectionDiagnosticsSummary,
  RunProjectionDiagnosticsOutput,
  ScoreRegressionCandidatesOutput,
} from '../diagnostics/types/diagnosticOutput.js';

export { fuseScenarioWithModel } from '../fusion/core/fuseScenarioWithModel.js';
export { recomputeIntervalsAfterFusion } from '../fusion/core/recomputeIntervalsAfterFusion.js';
export { recomputeDiagnosticsAfterFusion } from '../fusion/core/recomputeDiagnosticsAfterFusion.js';
export { applyAdditiveDelta } from '../fusion/policies/applyAdditiveDelta.js';
export { applyWeightedFusion } from '../fusion/policies/applyWeightedFusion.js';
export { applyBoundedFusion } from '../fusion/policies/applyBoundedFusion.js';
export { sampleFusionRun } from '../fusion/examples/sampleFusionRun.js';
export type { FusionPolicyName, FusionConfig, FusionPolicyInput, FusionPolicyResult } from '../fusion/types/fusionConfig.js';
export { defaultFusionConfig } from '../fusion/types/fusionConfig.js';
export type { FusedProjection, FusionConfidence, FusedProjectionDiagnostics } from '../fusion/types/fusedProjection.js';
