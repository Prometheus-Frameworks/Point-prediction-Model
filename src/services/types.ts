import type { NormalizedEvent } from '../ingestion/types/normalizedEvent.js';
import type { RawEvent } from '../ingestion/types/rawEvent.js';
import type { ScenarioRunResult } from '../models/scenarios/runScenario.js';
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

export type IngestRawEventsResult = ServiceResult<IngestRawEventsOutput>;
export type BuildScenariosResult = ServiceResult<BuildScenariosOutput>;
export type ProjectScenarioResult = ServiceResult<ProjectScenarioOutput>;
export type ProjectBatchResult = ServiceResult<ProjectBatchOutput>;
export type ProjectFromRawEventsResult = ServiceResult<ProjectFromRawEventsOutput>;

export type { ServiceError, ServiceResult, ServiceWarning };
