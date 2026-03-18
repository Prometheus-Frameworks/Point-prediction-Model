import { clamp, roundTo } from '../../utils/math.js';
import { applyWeightedFusion } from './applyWeightedFusion.js';
import type { FusionPolicyInput, FusionPolicyResult } from '../types/fusionConfig.js';

export const applyBoundedFusion = (input: FusionPolicyInput): FusionPolicyResult => {
  const weighted = applyWeightedFusion(input);
  const baselineCap = Math.max(
    input.config.minimumAbsoluteDeltaCap,
    Math.abs(input.baselinePointPrediction) * input.config.maxDeltaShareOfBaseline,
  );
  const intervalCap = Math.max(
    input.config.minimumAbsoluteDeltaCap,
    input.baselineIntervalWidth90 * input.config.maxDeltaShareOfIntervalWidth90,
  );
  const maxAllowedDelta = roundTo(Math.min(baselineCap, intervalCap));
  const boundedDelta = roundTo(clamp(weighted.appliedDelta, -maxAllowedDelta, maxAllowedDelta));

  return {
    policy: 'bounded-fusion-v1',
    appliedDelta: boundedDelta,
    confidenceWeight: weighted.confidenceWeight,
    maxAllowedDelta,
    notes: [
      ...weighted.notes,
      `Bounded the weighted delta to ±${maxAllowedDelta} using baseline-share and interval-width caps.`,
      boundedDelta !== weighted.appliedDelta
        ? `Delta was clipped from ${weighted.appliedDelta} to ${boundedDelta}.`
        : 'Delta remained inside the deterministic bound.',
    ],
  };
};
