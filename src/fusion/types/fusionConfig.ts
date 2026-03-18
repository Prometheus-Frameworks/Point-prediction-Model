import type { ProjectionEventType } from '../../types/event.js';

export type FusionPolicyName = 'additive-delta-v1' | 'weighted-fusion-v1' | 'bounded-fusion-v1';

export interface FusionConfig {
  policy: FusionPolicyName;
  supportedEventTypes: ProjectionEventType[];
  confidenceWeightFloor: number;
  confidenceWeightCeiling: number;
  clarityWeight: number;
  confidenceWeight: number;
  severityWeight: number;
  maxDeltaShareOfBaseline: number;
  maxDeltaShareOfIntervalWidth90: number;
  minimumAbsoluteDeltaCap: number;
  deltaUncertaintyMultiplier: number;
  contextUncertaintyMultiplier: number;
}

export interface FusionPolicyInput {
  baselinePointPrediction: number;
  scenarioDelta: number;
  eventType?: ProjectionEventType;
  eventConfidenceScore: number;
  eventClarity: number;
  eventSeverity: number;
  baselineIntervalWidth90: number;
  config: FusionConfig;
}

export interface FusionPolicyResult {
  policy: FusionPolicyName;
  appliedDelta: number;
  confidenceWeight: number;
  maxAllowedDelta: number;
  notes: string[];
}

export const defaultFusionConfig: FusionConfig = {
  policy: 'bounded-fusion-v1',
  supportedEventTypes: ['PLAYER_TRADE', 'TEAMMATE_INJURY', 'PLAYER_SIGNING', 'ROOKIE_ADDED'],
  confidenceWeightFloor: 0.15,
  confidenceWeightCeiling: 0.9,
  clarityWeight: 0.35,
  confidenceWeight: 0.45,
  severityWeight: 0.2,
  maxDeltaShareOfBaseline: 0.35,
  maxDeltaShareOfIntervalWidth90: 0.75,
  minimumAbsoluteDeltaCap: 1.5,
  deltaUncertaintyMultiplier: 0.35,
  contextUncertaintyMultiplier: 0.25,
};
