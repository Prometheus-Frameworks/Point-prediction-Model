import type { ProjectionDiagnosticOutput } from '../../diagnostics/types/diagnosticOutput.js';
import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type { IntervalPrediction } from '../../models_ml/types/uncertainty.js';
import type { ScenarioRunResult } from '../../models/scenarios/runScenario.js';
import type { ConfidenceBand } from '../../models/adjustments/confidenceScore.js';
import type { FusionPolicyName } from './fusionConfig.js';

export interface FusionConfidence {
  score: number;
  band: ConfidenceBand;
  eventConfidenceWeight: number;
  eventUncertainty: number;
  boundedDelta: boolean;
  rationale: string[];
}

export interface FusedProjectionDiagnostics {
  baseline: ProjectionDiagnosticOutput;
  fused: ProjectionDiagnosticOutput;
  notes: string[];
}

export interface FusedProjection {
  rowId: string;
  scenarioId: string;
  playerId: string;
  playerName: string;
  position: WrTeFeatureRow['player_position'];
  eventType: ScenarioRunResult['eventType'];
  baselinePointPrediction: number;
  scenarioDelta: number;
  appliedDelta: number;
  fusedPointPrediction: number;
  baselineIntervals: IntervalPrediction;
  fusedIntervals: IntervalPrediction;
  baselinePrediction: WrTeBaselinePrediction;
  scenarioResult: ScenarioRunResult;
  fusionPolicy: FusionPolicyName;
  fusionConfidence: FusionConfidence;
  diagnostics: FusedProjectionDiagnostics;
  notes: string[];
}
