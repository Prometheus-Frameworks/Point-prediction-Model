import { buildHistoricalDataset } from '../datasets/builders/buildHistoricalDataset.js';
import { HistoricalDatasetValidationError } from '../datasets/builders/buildLabeledRow.js';
import type { HistoricalLabeledRowInput } from '../datasets/types/labeledRow.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { BuildHistoricalDatasetResult } from './types.js';

const toDatasetServiceError = (error: unknown) => {
  if (error instanceof HistoricalDatasetValidationError) {
    return {
      code: 'HISTORICAL_DATASET_VALIDATION_FAILED',
      message: 'Historical dataset validation failed.',
      details: { issues: error.issues },
    };
  }

  return {
    code: 'HISTORICAL_DATASET_BUILD_FAILED',
    message: error instanceof Error ? error.message : 'Unknown historical dataset build error.',
  };
};

export const buildHistoricalDatasetService = (
  inputs: HistoricalLabeledRowInput[],
): BuildHistoricalDatasetResult => {
  try {
    const rows = buildHistoricalDataset(inputs);
    const warnings =
      inputs.length === 0
        ? [
            {
              code: 'NO_HISTORICAL_INPUTS',
              message: 'No historical inputs were provided, so the dataset is empty.',
            },
          ]
        : [];

    return serviceSuccess({ inputs: [...inputs], rows }, warnings);
  } catch (error) {
    return serviceFailure(toDatasetServiceError(error));
  }
};
