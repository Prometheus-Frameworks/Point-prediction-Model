import type { WrTeFeatureRow } from '../features/types/featureRow.js';
import { predictWithIntervalsService, type PredictWithIntervalsOptions } from './predictWithIntervalsService.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { RunProjectionDiagnosticsResult } from './types.js';
import { scoreRegressionCandidates } from './scoreRegressionCandidatesService.js';

export interface RunProjectionDiagnosticsOptions extends PredictWithIntervalsOptions {
  generatedAt?: string;
}

export const runProjectionDiagnosticsService = async (
  rows: WrTeFeatureRow[],
  options: RunProjectionDiagnosticsOptions,
): Promise<RunProjectionDiagnosticsResult> => {
  try {
    const predictionResult = await predictWithIntervalsService(rows, options);
    if (!predictionResult.ok) {
      return predictionResult;
    }

    const diagnostics = scoreRegressionCandidates(
      rows.map((row, index) => ({
        row,
        prediction: predictionResult.data.predictions[index],
      })),
      options.generatedAt,
    );

    return serviceSuccess({
      rows,
      predictions: predictionResult.data.predictions,
      diagnostics: diagnostics.diagnostics,
      generatedAt: diagnostics.generatedAt,
    }, predictionResult.warnings);
  } catch (error) {
    return serviceFailure({
      code: 'PROJECTION_DIAGNOSTICS_FAILED',
      message: error instanceof Error ? error.message : 'Unknown projection diagnostics error.',
    });
  }
};
