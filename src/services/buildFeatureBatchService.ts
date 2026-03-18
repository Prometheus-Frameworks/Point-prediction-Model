import { buildFeatureRow } from '../features/builders/buildFeatureRow.js';
import type { WrTeFeatureSourceInput } from '../features/types/sourceTypes.js';
import { FeatureRowValidationError } from '../features/validation/validateFeatureRow.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { BuildFeatureBatchResult } from './types.js';

const toFeatureBatchError = (error: unknown) => {
  if (error instanceof FeatureRowValidationError) {
    return {
      code: 'FEATURE_BATCH_VALIDATION_FAILED',
      message: 'Feature batch validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'FEATURE_BATCH_BUILD_FAILED',
    message: error instanceof Error ? error.message : 'Unknown feature batch build error.',
  };
};

export const buildFeatureBatchService = (inputs: WrTeFeatureSourceInput[]): BuildFeatureBatchResult => {
  try {
    const rows = inputs.map((input) => buildFeatureRow(input));
    const warnings =
      inputs.length === 0
        ? [
            {
              code: 'NO_FEATURE_INPUTS',
              message: 'No feature inputs were provided, so no feature rows were built.',
            },
          ]
        : [];

    return serviceSuccess({ sources: [...inputs], rows }, warnings);
  } catch (error) {
    return serviceFailure(toFeatureBatchError(error));
  }
};
