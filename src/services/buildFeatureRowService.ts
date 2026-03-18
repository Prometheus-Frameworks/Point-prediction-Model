import { buildFeatureRow } from '../features/builders/buildFeatureRow.js';
import type { WrTeFeatureSourceInput } from '../features/types/sourceTypes.js';
import { FeatureRowValidationError } from '../features/validation/validateFeatureRow.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { BuildFeatureRowResult } from './types.js';

const toFeatureServiceError = (error: unknown) => {
  if (error instanceof FeatureRowValidationError) {
    return {
      code: 'FEATURE_ROW_VALIDATION_FAILED',
      message: 'Feature row validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'FEATURE_ROW_BUILD_FAILED',
    message: error instanceof Error ? error.message : 'Unknown feature row build error.',
  };
};

export const buildFeatureRowService = (input: WrTeFeatureSourceInput): BuildFeatureRowResult => {
  try {
    return serviceSuccess({ source: input, row: buildFeatureRow(input) });
  } catch (error) {
    return serviceFailure(toFeatureServiceError(error));
  }
};
