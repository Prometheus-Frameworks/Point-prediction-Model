import { subgroupDefinitions } from '../../models_ml/subgroup/subgroupDefinitions.js';
import type { CalibrationBucketRow, CalibrationReport, SubgroupStabilityReport } from '../../models_ml/types/uncertainty.js';
import type { MarketComparisonOutput, MarketEdgeScoringContext, MarketProjectionInput, TrustAdjustmentBreakdown } from '../types/edgeOutput.js';

const roundToTenth = (value: number): number => Number(value.toFixed(1));
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const scoreCalibrationPenalty = (report?: CalibrationReport): number => {
  if (!report) {
    return 0;
  }

  const coverage90Gap = report.overall.coverage90 === null ? 0.08 : Math.max(0, 0.86 - report.overall.coverage90);
  const biasPenalty = Math.max(0, Math.abs(report.overall.overallBias) - 1.5) * 0.03;
  const bucketBiasPenalty = Math.max(0, report.reliability.meanAbsoluteBucketBias - 1.2) * 0.04;

  return clamp(coverage90Gap * 0.9 + biasPenalty + bucketBiasPenalty, 0, 0.18);
};

const scoreSubgroupPenalty = (
  report: SubgroupStabilityReport | undefined,
  projection: MarketProjectionInput,
  actualPointPrediction: number,
): { penalty: number; matchedSubgroups: string[] } => {
  if (!report || !projection.row) {
    return { penalty: 0, matchedSubgroups: [] };
  }

  const matchedGroups = subgroupDefinitions.flatMap((family) => family.groups
    .filter((group) => group.matches({ row: projection.row!, pointPrediction: actualPointPrediction, actual: 0 }))
    .map((group) => `${family.family}:${group.key}`));

  const matchedRows = report.groups.filter((group) => matchedGroups.includes(`${group.family}:${group.subgroup}`));
  if (matchedRows.length === 0) {
    return { penalty: 0.06, matchedSubgroups: matchedGroups };
  }

  const penalty = matchedRows.reduce((sum, group) => {
    const samplePenalty = group.sampleSize < 25 ? 0.05 : group.sampleSize < 60 ? 0.025 : 0;
    const coveragePenalty = group.coverage90 !== null && group.coverage90 < 0.8 ? 0.03 : 0;
    const errorPenalty = group.mae > 6 ? 0.03 : group.mae > 4.5 ? 0.015 : 0;
    return sum + samplePenalty + coveragePenalty + errorPenalty;
  }, 0) / matchedRows.length;

  return {
    penalty: clamp(penalty, 0, 0.18),
    matchedSubgroups: matchedRows.map((group) => `${group.family}:${group.subgroup}`),
  };
};

const scoreIntervalWidthPenalty = (projection: MarketProjectionInput): { intervalWidth90?: number; penalty: number } => {
  const intervalWidth90 = projection.prediction
    ? projection.prediction.upper90 - projection.prediction.lower90
    : projection.diagnostics?.intervalWidth90;

  if (intervalWidth90 === undefined) {
    return { intervalWidth90: undefined, penalty: 0 };
  }

  return {
    intervalWidth90: roundToTenth(intervalWidth90),
    penalty: clamp((intervalWidth90 - 8) / 20, 0, 0.35),
  };
};

const scoreFragilityPenalty = (projection: MarketProjectionInput): number => {
  if (!projection.diagnostics) {
    return 0;
  }

  return clamp((projection.diagnostics.fragilityScore / 100) * 0.25, 0, 0.25);
};

const scoreEventPenalty = (projection: MarketProjectionInput): number => {
  if (!projection.row || projection.row.event_type === 'NONE') {
    return 0;
  }

  const clarityPenalty = (1 - projection.row.event_clarity) * 0.12;
  const severityPenalty = clamp(projection.row.event_severity / 10, 0, 1) * 0.08;
  const recencyPenalty = projection.row.event_has_recent_signal > 0 ? 0.02 : 0;

  return clamp(clarityPenalty + severityPenalty + recencyPenalty, 0, 0.22);
};

export const scoreTrustAdjustedEdge = (
  comparison: MarketComparisonOutput,
  projection: MarketProjectionInput,
  context: MarketEdgeScoringContext = {},
): { trustAdjustedEdgeScore: number; trustAdjustment: TrustAdjustmentBreakdown } => {
  const intervalBreakdown = scoreIntervalWidthPenalty(projection);
  const fragilityPenalty = scoreFragilityPenalty(projection);
  const eventUncertaintyPenalty = scoreEventPenalty(projection);
  const calibrationPenalty = scoreCalibrationPenalty(context.calibrationReport);
  const subgroupBreakdown = scoreSubgroupPenalty(context.subgroupReport, projection, comparison.modelPoints);

  const totalPenalty = clamp(
    intervalBreakdown.penalty + fragilityPenalty + eventUncertaintyPenalty + calibrationPenalty + subgroupBreakdown.penalty,
    0,
    0.8,
  );
  const confidenceMultiplier = clamp(1 - totalPenalty, 0.2, 1);

  return {
    trustAdjustedEdgeScore: roundToTenth(comparison.rawEdgeScore * confidenceMultiplier),
    trustAdjustment: {
      intervalWidth90: intervalBreakdown.intervalWidth90,
      intervalWidthPenalty: roundToTenth(intervalBreakdown.penalty),
      fragilityPenalty: roundToTenth(fragilityPenalty),
      eventUncertaintyPenalty: roundToTenth(eventUncertaintyPenalty),
      calibrationPenalty: roundToTenth(calibrationPenalty),
      subgroupPenalty: roundToTenth(subgroupBreakdown.penalty),
      totalPenalty: roundToTenth(totalPenalty),
      confidenceMultiplier: roundToTenth(confidenceMultiplier),
      matchedSubgroups: subgroupBreakdown.matchedSubgroups,
    },
  };
};
