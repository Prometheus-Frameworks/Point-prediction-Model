import { buildDiagnosticFlags } from '../diagnostics/explain/buildDiagnosticFlags.js';
import { buildRegressionExplanation } from '../diagnostics/explain/buildRegressionExplanation.js';
import { combineRegressionScores } from '../diagnostics/scoring/combineRegressionScores.js';
import { scoreEfficiencyFragility } from '../diagnostics/scoring/scoreEfficiencyFragility.js';
import { scoreProjectionStickiness } from '../diagnostics/scoring/scoreProjectionStickiness.js';
import { scoreTdRegressionRisk } from '../diagnostics/scoring/scoreTdRegressionRisk.js';
import { scoreUsageProductionGap } from '../diagnostics/scoring/scoreUsageProductionGap.js';
import { scoreVolumeStability } from '../diagnostics/scoring/scoreVolumeStability.js';
import type { ProjectionDiagnosticOutput, ScoreRegressionCandidatesOutput } from '../diagnostics/types/diagnosticOutput.js';
import type { ProjectionDiagnosticInput, RegressionComponentScores } from '../diagnostics/types/regressionSignal.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { ScoreRegressionCandidatesResult } from './types.js';

export const buildProjectionDiagnostic = (input: ProjectionDiagnosticInput): ProjectionDiagnosticOutput => {
  const componentScores: RegressionComponentScores = {
    usageProductionGap: scoreUsageProductionGap(input),
    efficiencyFragility: scoreEfficiencyFragility(input),
    tdRegressionRisk: scoreTdRegressionRisk(input),
    volumeStability: scoreVolumeStability(input),
    projectionStickiness: scoreProjectionStickiness(input),
  };
  const combined = combineRegressionScores(componentScores);
  const flags = buildDiagnosticFlags(input, componentScores, combined);
  const explanationBullets = buildRegressionExplanation(input, componentScores, combined, flags);

  return {
    ...input,
    ...combined,
    playerId: input.row.player_id,
    playerName: input.row.player_name,
    position: input.row.player_position,
    scenarioId: input.row.scenario_id,
    intervalWidth90: Number((input.prediction.upper90 - input.prediction.lower90).toFixed(2)),
    intervalWidth80: Number((input.prediction.upper80 - input.prediction.lower80).toFixed(2)),
    componentScores,
    flags,
    explanationBullets,
  };
};

export const scoreRegressionCandidates = (
  inputs: ProjectionDiagnosticInput[],
  generatedAt = new Date().toISOString(),
): ScoreRegressionCandidatesOutput => ({
  diagnostics: inputs.map(buildProjectionDiagnostic),
  generatedAt,
});

export const scoreRegressionCandidatesService = (
  inputs: ProjectionDiagnosticInput[],
  generatedAt?: string,
): ScoreRegressionCandidatesResult => {
  try {
    return serviceSuccess(scoreRegressionCandidates(inputs, generatedAt));
  } catch (error) {
    return serviceFailure({
      code: 'REGRESSION_CANDIDATE_SCORING_FAILED',
      message: error instanceof Error ? error.message : 'Unknown regression candidate scoring error.',
    });
  }
};
