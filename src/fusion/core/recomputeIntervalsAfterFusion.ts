import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type { IntervalPrediction } from '../../models_ml/types/uncertainty.js';
import { clamp, roundTo } from '../../utils/math.js';
import type { FusionConfig } from '../types/fusionConfig.js';

export interface RecomputeIntervalsAfterFusionInput {
  baselinePrediction: WrTeBaselinePrediction;
  fusedPointPrediction: number;
  appliedDelta: number;
  eventConfidenceWeight: number;
  eventClarity: number;
  config: FusionConfig;
}

export interface RecomputedFusedIntervals {
  intervals: IntervalPrediction;
  notes: string[];
  eventUncertainty: number;
}

const buildShiftedInterval = (
  center: number,
  baselineLower: number,
  baselineUpper: number,
  widening: number,
) => {
  const lowerHalfWidth = Math.max(0, center - baselineLower) + widening;
  const upperHalfWidth = Math.max(0, baselineUpper - center) + widening;

  return {
    lower: clamp(roundTo(center - lowerHalfWidth), 0, Number.MAX_SAFE_INTEGER),
    upper: clamp(roundTo(Math.max(center + upperHalfWidth, center)), 0, Number.MAX_SAFE_INTEGER),
  };
};

export const recomputeIntervalsAfterFusion = (
  input: RecomputeIntervalsAfterFusionInput,
): RecomputedFusedIntervals => {
  const baselineWidth50 = input.baselinePrediction.upper50 - input.baselinePrediction.lower50;
  const baselineWidth80 = input.baselinePrediction.upper80 - input.baselinePrediction.lower80;
  const baselineWidth90 = input.baselinePrediction.upper90 - input.baselinePrediction.lower90;
  const eventUncertainty = clamp(
    ((1 - input.eventConfidenceWeight) * 0.6) + ((1 - clamp(input.eventClarity, 0, 1)) * 0.4),
    0,
    1,
  );
  const wideningBase =
    Math.abs(input.appliedDelta) * input.config.deltaUncertaintyMultiplier
    + baselineWidth90 * eventUncertainty * input.config.contextUncertaintyMultiplier;

  const band50 = buildShiftedInterval(input.fusedPointPrediction, input.baselinePrediction.lower50, input.baselinePrediction.upper50, roundTo(wideningBase * 0.4));
  const band80 = buildShiftedInterval(input.fusedPointPrediction, input.baselinePrediction.lower80, input.baselinePrediction.upper80, roundTo(wideningBase * 0.7));
  const band90 = buildShiftedInterval(input.fusedPointPrediction, input.baselinePrediction.lower90, input.baselinePrediction.upper90, roundTo(wideningBase));

  return {
    intervals: {
      pointPrediction: input.fusedPointPrediction,
      lower50: Math.min(band50.lower, input.fusedPointPrediction),
      upper50: Math.max(band50.upper, input.fusedPointPrediction),
      lower80: Math.min(band80.lower, band50.lower),
      upper80: Math.max(band80.upper, band50.upper),
      lower90: Math.min(band90.lower, band80.lower),
      upper90: Math.max(band90.upper, band80.upper),
      uncertaintyBucket: `${input.baselinePrediction.uncertaintyBucket}:fused`,
      intervalMethod: input.baselinePrediction.intervalMethod,
    },
    notes: [
      `Shifted interval center from ${input.baselinePrediction.pointPrediction} to ${input.fusedPointPrediction}.`,
      `Widened 90% interval by ${roundTo((band90.upper - band90.lower) - baselineWidth90)} points from applied delta ${input.appliedDelta} and event uncertainty ${roundTo(eventUncertainty)}.`,
      `Baseline widths were 50/80/90 = ${roundTo(baselineWidth50)}/${roundTo(baselineWidth80)}/${roundTo(baselineWidth90)}.`,
    ],
    eventUncertainty: roundTo(eventUncertainty, 4),
  };
};
