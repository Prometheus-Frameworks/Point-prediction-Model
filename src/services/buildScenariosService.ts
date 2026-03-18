import { buildScenariosFromEvents } from '../ingestion/build/buildScenarioFromEvent.js';
import type { NormalizedEvent } from '../ingestion/types/normalizedEvent.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { BuildScenariosResult } from './types.js';

export const buildScenarios = (normalizedEvents: NormalizedEvent[]): BuildScenariosResult => {
  try {
    const scenarios = buildScenariosFromEvents(normalizedEvents);
    const warnings =
      normalizedEvents.length === 0
        ? [
            {
              code: 'NO_NORMALIZED_EVENTS',
              message: 'No normalized events were provided, so no scenarios were built.',
            },
          ]
        : [];

    return serviceSuccess({ normalizedEvents: [...normalizedEvents], scenarios }, warnings);
  } catch (error) {
    return serviceFailure({
      code: 'SCENARIO_BUILD_FAILED',
      message: error instanceof Error ? error.message : 'Unknown scenario build error.',
    });
  }
};
