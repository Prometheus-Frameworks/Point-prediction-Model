import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type { ScenarioRunResult } from '../../models/scenarios/runScenario.js';
import { roundTo } from '../../utils/math.js';
import { applyAdditiveDelta } from '../policies/applyAdditiveDelta.js';
import { applyBoundedFusion } from '../policies/applyBoundedFusion.js';
import { applyWeightedFusion } from '../policies/applyWeightedFusion.js';
import { defaultFusionConfig, type FusionConfig, type FusionPolicyInput } from '../types/fusionConfig.js';
import type { FusedProjection } from '../types/fusedProjection.js';
import { recomputeIntervalsAfterFusion } from './recomputeIntervalsAfterFusion.js';
import { recomputeDiagnosticsAfterFusion } from './recomputeDiagnosticsAfterFusion.js';

export interface FuseScenarioWithModelInput {
  row: WrTeFeatureRow;
  baselinePrediction: WrTeBaselinePrediction;
  scenarioResult: ScenarioRunResult;
  config?: Partial<FusionConfig>;
}

const pickPolicy = (policyInput: FusionPolicyInput) => {
  switch (policyInput.config.policy) {
    case 'additive-delta-v1':
      return applyAdditiveDelta(policyInput);
    case 'weighted-fusion-v1':
      return applyWeightedFusion(policyInput);
    case 'bounded-fusion-v1':
    default:
      return applyBoundedFusion(policyInput);
  }
};

export const fuseScenarioWithModel = (input: FuseScenarioWithModelInput): FusedProjection => {
  const config: FusionConfig = { ...defaultFusionConfig, ...input.config };
  const eventType = input.scenarioResult.eventType;
  const baselineIntervals = {
    pointPrediction: input.baselinePrediction.pointPrediction,
    lower50: input.baselinePrediction.lower50,
    upper50: input.baselinePrediction.upper50,
    lower80: input.baselinePrediction.lower80,
    upper80: input.baselinePrediction.upper80,
    lower90: input.baselinePrediction.lower90,
    upper90: input.baselinePrediction.upper90,
    uncertaintyBucket: input.baselinePrediction.uncertaintyBucket,
    intervalMethod: input.baselinePrediction.intervalMethod,
  };

  if (eventType && !config.supportedEventTypes.includes(eventType)) {
    throw new Error(`Fusion does not support event type '${eventType}'.`);
  }

  const scenarioDelta = roundTo(input.scenarioResult.deltaPprPointsPerGame);
  const policyResult = pickPolicy({
    baselinePointPrediction: input.baselinePrediction.pointPrediction,
    scenarioDelta,
    eventType,
    eventConfidenceScore: input.scenarioResult.confidenceScore,
    eventClarity: input.scenarioResult.event?.clarity ?? input.row.event_clarity,
    eventSeverity: input.scenarioResult.event?.severity ?? input.row.event_severity,
    baselineIntervalWidth90: input.baselinePrediction.upper90 - input.baselinePrediction.lower90,
    config,
  });

  const fusedPointPrediction = roundTo(Math.max(0, input.baselinePrediction.pointPrediction + policyResult.appliedDelta));
  const intervalResult = recomputeIntervalsAfterFusion({
    baselinePrediction: input.baselinePrediction,
    fusedPointPrediction,
    appliedDelta: policyResult.appliedDelta,
    eventConfidenceWeight: policyResult.confidenceWeight,
    eventClarity: input.scenarioResult.event?.clarity ?? input.row.event_clarity,
    config,
  });
  const diagnostics = recomputeDiagnosticsAfterFusion({
    row: input.row,
    baselinePrediction: input.baselinePrediction,
    fusedIntervals: intervalResult.intervals,
  });
  const bounded = Math.abs(policyResult.appliedDelta) < Math.abs(scenarioDelta);

  return {
    rowId: input.baselinePrediction.rowId,
    scenarioId: input.scenarioResult.scenarioId,
    playerId: input.baselinePrediction.playerId,
    playerName: input.baselinePrediction.playerName,
    position: input.baselinePrediction.position,
    eventType,
    baselinePointPrediction: input.baselinePrediction.pointPrediction,
    scenarioDelta,
    appliedDelta: policyResult.appliedDelta,
    fusedPointPrediction,
    baselineIntervals,
    fusedIntervals: intervalResult.intervals,
    baselinePrediction: input.baselinePrediction,
    scenarioResult: input.scenarioResult,
    fusionPolicy: policyResult.policy,
    fusionConfidence: {
      score: input.scenarioResult.confidenceScore,
      band: input.scenarioResult.confidenceBand,
      eventConfidenceWeight: policyResult.confidenceWeight,
      eventUncertainty: intervalResult.eventUncertainty,
      boundedDelta: bounded,
      rationale: [
        `Scenario confidence band ${input.scenarioResult.confidenceBand} (${input.scenarioResult.confidenceScore}).`,
        `Fusion weight ${policyResult.confidenceWeight} on scenario delta ${scenarioDelta}.`,
        `Event uncertainty contribution ${intervalResult.eventUncertainty}.`,
      ],
    },
    diagnostics,
    notes: [
      ...policyResult.notes,
      ...intervalResult.notes,
      ...diagnostics.notes,
      `Baseline point prediction ${input.baselinePrediction.pointPrediction} fused to ${fusedPointPrediction}.`,
    ],
  };
};
