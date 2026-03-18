import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type { IntervalPrediction } from '../../models_ml/types/uncertainty.js';
import { buildProjectionDiagnostic } from '../../services/scoreRegressionCandidatesService.js';
import type { FusedProjectionDiagnostics } from '../types/fusedProjection.js';

export interface RecomputeDiagnosticsAfterFusionInput {
  row: WrTeFeatureRow;
  baselinePrediction: WrTeBaselinePrediction;
  fusedIntervals: IntervalPrediction;
}

export const recomputeDiagnosticsAfterFusion = (
  input: RecomputeDiagnosticsAfterFusionInput,
): FusedProjectionDiagnostics => {
  const baseline = buildProjectionDiagnostic({ row: input.row, prediction: input.baselinePrediction });
  const fused = buildProjectionDiagnostic({
    row: input.row,
    prediction: {
      ...input.baselinePrediction,
      predictedPpr: input.fusedIntervals.pointPrediction,
      ...input.fusedIntervals,
    },
  });

  return {
    baseline,
    fused,
    notes: [
      `Diagnostic interval width moved from ${baseline.intervalWidth90} to ${fused.intervalWidth90}.`,
      `Fused stickiness/fragility changed from ${baseline.stickinessScore}/${baseline.fragilityScore} to ${fused.stickinessScore}/${fused.fragilityScore}.`,
    ],
  };
};
