import { clamp, roundTo } from '../../utils/math.js';
import type { FusionPolicyInput, FusionPolicyResult } from '../types/fusionConfig.js';

export const applyWeightedFusion = (input: FusionPolicyInput): FusionPolicyResult => {
  const confidenceScoreWeight = clamp(input.eventConfidenceScore / 100, 0, 1);
  const clarityWeight = clamp(input.eventClarity, 0, 1);
  const severityWeight = clamp(input.eventSeverity / 10, 0, 1);
  const rawWeight =
    confidenceScoreWeight * input.config.confidenceWeight
    + clarityWeight * input.config.clarityWeight
    + severityWeight * input.config.severityWeight;
  const boundedWeight = clamp(
    rawWeight,
    input.config.confidenceWeightFloor,
    input.config.confidenceWeightCeiling,
  );

  return {
    policy: 'weighted-fusion-v1',
    appliedDelta: roundTo(input.scenarioDelta * boundedWeight),
    confidenceWeight: roundTo(boundedWeight, 4),
    maxAllowedDelta: Number.POSITIVE_INFINITY,
    notes: [
      `Weighted scenario delta by ${roundTo(boundedWeight)} from confidence ${input.eventConfidenceScore}, clarity ${input.eventClarity}, and severity ${input.eventSeverity}.`,
    ],
  };
};
