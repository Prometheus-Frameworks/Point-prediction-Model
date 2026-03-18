import { roundTo } from '../../utils/math.js';
import type { FusionPolicyInput, FusionPolicyResult } from '../types/fusionConfig.js';

export const applyAdditiveDelta = (input: FusionPolicyInput): FusionPolicyResult => ({
  policy: 'additive-delta-v1',
  appliedDelta: roundTo(input.scenarioDelta),
  confidenceWeight: 1,
  maxAllowedDelta: Number.POSITIVE_INFINITY,
  notes: ['Applied the full deterministic scenario delta without attenuation.'],
});
