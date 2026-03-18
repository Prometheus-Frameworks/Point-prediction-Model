import type { RawEvent } from '../ingestion/types/rawEvent.js';
import { mergeServiceWarnings, serviceFailure, serviceSuccess } from './result.js';
import { buildScenarios } from './buildScenariosService.js';
import { ingestRawEvents } from './ingestRawEventsService.js';
import { projectBatch } from './projectBatchService.js';
import type { ProjectFromRawEventsResult } from './types.js';

export const projectFromRawEvents = (rawEvents: RawEvent[]): ProjectFromRawEventsResult => {
  const ingestionResult = ingestRawEvents(rawEvents);
  if (!ingestionResult.ok) {
    return ingestionResult;
  }

  const scenarioResult = buildScenarios(ingestionResult.data.normalizedEvents);
  if (!scenarioResult.ok) {
    return serviceFailure(scenarioResult.errors, mergeServiceWarnings(ingestionResult.warnings, scenarioResult.warnings));
  }

  const projectionResult = projectBatch(scenarioResult.data.scenarios);
  if (!projectionResult.ok) {
    return serviceFailure(
      projectionResult.errors,
      mergeServiceWarnings(ingestionResult.warnings, scenarioResult.warnings, projectionResult.warnings),
    );
  }

  return serviceSuccess(
    {
      rawEvents: ingestionResult.data.rawEvents,
      normalizedEvents: ingestionResult.data.normalizedEvents,
      scenarios: scenarioResult.data.scenarios,
      results: projectionResult.data.results,
    },
    mergeServiceWarnings(ingestionResult.warnings, scenarioResult.warnings, projectionResult.warnings),
  );
};
