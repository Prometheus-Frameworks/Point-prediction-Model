import type { WrTeFeatureRow } from '../features/types/featureRow.js';
import type { WindowEvaluation, BacktestReport } from '../datasets/types/metrics.js';
import type { HistoricalLabeledRowInput, WrTeLabeledRow } from '../datasets/types/labeledRow.js';
import type { RollingBacktestWindow } from '../datasets/types/split.js';
import type { WrTeFeatureSourceInput } from '../features/types/sourceTypes.js';
import type { NormalizedEvent } from '../ingestion/types/normalizedEvent.js';
import type { RawEvent } from '../ingestion/types/rawEvent.js';
import type { ScenarioRunResult } from '../models/scenarios/runScenario.js';
import type { WrTeBaselineModelArtifact } from '../models_ml/types/modelArtifact.js';
import type { WrTeBaselinePrediction, PredictionComparisonRow } from '../models_ml/types/prediction.js';
import type { TrainWrTeBaselineModelResult } from '../models_ml/training/trainWrTeBaselineModel.js';
import type { ProjectionScenario } from '../types/scenario.js';
import type { ServiceError, ServiceResult, ServiceWarning } from './result.js';

export interface IngestRawEventsOutput {
  rawEvents: RawEvent[];
  normalizedEvents: NormalizedEvent[];
}

export interface BuildScenariosOutput {
  normalizedEvents: NormalizedEvent[];
  scenarios: ProjectionScenario[];
}

export interface BuildFeatureRowOutput {
  source: WrTeFeatureSourceInput;
  row: WrTeFeatureRow;
}

export interface BuildFeatureBatchOutput {
  sources: WrTeFeatureSourceInput[];
  rows: WrTeFeatureRow[];
}

export interface ProjectScenarioOutput {
  scenario: ProjectionScenario;
  result: ScenarioRunResult;
}

export interface ProjectBatchOutput {
  scenarios: ProjectionScenario[];
  results: ScenarioRunResult[];
}

export interface ProjectFromRawEventsOutput {
  rawEvents: RawEvent[];
  normalizedEvents: NormalizedEvent[];
  scenarios: ProjectionScenario[];
  results: ScenarioRunResult[];
}

export interface BuildHistoricalDatasetOutput {
  inputs: HistoricalLabeledRowInput[];
  rows: WrTeLabeledRow[];
}

export interface RunBacktestOutput {
  dataset: WrTeLabeledRow[];
  windows: RollingBacktestWindow[];
  evaluations: WindowEvaluation[];
  report: BacktestReport;
}

export interface TrainBaselineModelOutput extends TrainWrTeBaselineModelResult {}

export interface PredictBaselineModelOutput {
  artifact: WrTeBaselineModelArtifact;
  predictions: WrTeBaselinePrediction[];
}

export interface RunModelBacktestOutput {
  dataset: WrTeLabeledRow[];
  windows: RollingBacktestWindow[];
  evaluations: WindowEvaluation[];
  report: BacktestReport;
  comparisons: Array<{
    windowIndex: number;
    comparison: PredictionComparisonRow[];
    featureImportance: WrTeBaselineModelArtifact['featureImportance'];
  }>;
}

export type IngestRawEventsResult = ServiceResult<IngestRawEventsOutput>;
export type BuildScenariosResult = ServiceResult<BuildScenariosOutput>;
export type BuildFeatureRowResult = ServiceResult<BuildFeatureRowOutput>;
export type BuildFeatureBatchResult = ServiceResult<BuildFeatureBatchOutput>;
export type ProjectScenarioResult = ServiceResult<ProjectScenarioOutput>;
export type ProjectBatchResult = ServiceResult<ProjectBatchOutput>;
export type ProjectFromRawEventsResult = ServiceResult<ProjectFromRawEventsOutput>;
export type BuildHistoricalDatasetResult = ServiceResult<BuildHistoricalDatasetOutput>;
export type RunBacktestResult = ServiceResult<RunBacktestOutput>;
export type TrainBaselineModelResult = ServiceResult<TrainBaselineModelOutput>;
export type PredictBaselineModelResult = ServiceResult<PredictBaselineModelOutput>;
export type RunModelBacktestResult = ServiceResult<RunModelBacktestOutput>;

export type { ServiceError, ServiceResult, ServiceWarning };
