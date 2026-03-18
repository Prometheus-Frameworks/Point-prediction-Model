import { average, rootMeanSquare } from '../../utils/math.js';
import { assignPredictionInterval } from '../uncertainty/assignPredictionInterval.js';
import type { CalibrationReport, WrTeBaselineUncertaintyArtifact } from '../types/uncertainty.js';
import { buildCalibrationTable, type CalibrationInput } from './buildCalibrationTable.js';
import { buildReliabilityReport } from './buildReliabilityReport.js';

const averageCoverage = (values: boolean[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  return values.filter(Boolean).length / values.length;
};

export const evaluateCalibration = (
  inputs: CalibrationInput[],
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact,
  generatedAt = new Date().toISOString(),
): CalibrationReport => {
  const buckets = buildCalibrationTable(inputs, uncertaintyArtifact);
  const residuals = inputs.map((input) => input.actual - input.pointPrediction);
  const absoluteErrors = residuals.map((residual) => Math.abs(residual));

  const coverage50 = uncertaintyArtifact
    ? averageCoverage(inputs.map((input) => {
      const interval = assignPredictionInterval(uncertaintyArtifact, input.row, input.pointPrediction);
      return input.actual >= interval.lower50 && input.actual <= interval.upper50;
    }))
    : null;
  const coverage80 = uncertaintyArtifact
    ? averageCoverage(inputs.map((input) => {
      const interval = assignPredictionInterval(uncertaintyArtifact, input.row, input.pointPrediction);
      return input.actual >= interval.lower80 && input.actual <= interval.upper80;
    }))
    : null;
  const coverage90 = uncertaintyArtifact
    ? averageCoverage(inputs.map((input) => {
      const interval = assignPredictionInterval(uncertaintyArtifact, input.row, input.pointPrediction);
      return input.actual >= interval.lower90 && input.actual <= interval.upper90;
    }))
    : null;

  return {
    generatedAt,
    sampleSize: inputs.length,
    intervalMethod: 'residual-empirical-v1',
    overall: {
      sampleSize: inputs.length,
      overallBias: average(residuals),
      overallMae: average(absoluteErrors),
      overallRmse: rootMeanSquare(residuals),
      coverage50,
      coverage80,
      coverage90,
    },
    buckets,
    reliability: buildReliabilityReport(buckets),
  };
};
