export { buildScenarios } from '../services/buildScenariosService.js';
export { buildFeatureBatchService } from '../services/buildFeatureBatchService.js';
export { buildFeatureRowService } from '../services/buildFeatureRowService.js';
export { ingestRawEvents } from '../services/ingestRawEventsService.js';
export { projectBatch } from '../services/projectBatchService.js';
export { projectFromRawEvents } from '../services/projectFromRawEventsService.js';
export { projectScenario } from '../services/projectScenarioService.js';
export type {
  BuildFeatureBatchOutput,
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
