import { average, rootMeanSquare } from '../../utils/math.js';
import { assignPredictionInterval } from '../uncertainty/assignPredictionInterval.js';
import type { SubgroupStabilityReport, SubgroupStabilityRow, WrTeBaselineUncertaintyArtifact } from '../types/uncertainty.js';
import type { CalibrationInput } from '../calibration/buildCalibrationTable.js';
import { subgroupDefinitions } from './subgroupDefinitions.js';

const averageCoverage = (values: boolean[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  return values.filter(Boolean).length / values.length;
};

export const evaluateSubgroupStability = (
  inputs: CalibrationInput[],
  uncertaintyArtifact?: WrTeBaselineUncertaintyArtifact,
  generatedAt = new Date().toISOString(),
): SubgroupStabilityReport => {
  const groups: SubgroupStabilityRow[] = [];

  for (const family of subgroupDefinitions) {
    for (const group of family.groups) {
      const matched = inputs.filter((input) => group.matches(input));
      const residuals = matched.map((input) => input.actual - input.pointPrediction);
      const absoluteErrors = residuals.map((residual) => Math.abs(residual));
      const intervals = uncertaintyArtifact
        ? matched.map((input) => assignPredictionInterval(uncertaintyArtifact, input.row, input.pointPrediction))
        : [];

      groups.push({
        family: family.family,
        subgroup: group.key,
        label: group.label,
        sampleSize: matched.length,
        averagePrediction: average(matched.map((input) => input.pointPrediction)),
        averageActual: average(matched.map((input) => input.actual)),
        bias: average(residuals),
        mae: average(absoluteErrors),
        rmse: rootMeanSquare(residuals),
        coverage50: uncertaintyArtifact
          ? averageCoverage(matched.map((input, index) => input.actual >= intervals[index].lower50 && input.actual <= intervals[index].upper50))
          : null,
        coverage80: uncertaintyArtifact
          ? averageCoverage(matched.map((input, index) => input.actual >= intervals[index].lower80 && input.actual <= intervals[index].upper80))
          : null,
        coverage90: uncertaintyArtifact
          ? averageCoverage(matched.map((input, index) => input.actual >= intervals[index].lower90 && input.actual <= intervals[index].upper90))
          : null,
      });
    }
  }

  return {
    generatedAt,
    sampleSize: inputs.length,
    intervalMethod: 'residual-empirical-v1',
    groups,
  };
};
