import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type {
  CombinedRegressionScores,
  ProjectionDiagnosticInput,
  RegressionComponentScores,
  RegressionDiagnosticFlag,
} from './regressionSignal.js';

export interface ProjectionDiagnosticOutput extends ProjectionDiagnosticInput, CombinedRegressionScores {
  playerId: string;
  playerName: string;
  position: WrTeFeatureRow['player_position'];
  scenarioId: string;
  intervalWidth90: number;
  intervalWidth80: number;
  componentScores: RegressionComponentScores;
  flags: RegressionDiagnosticFlag[];
  explanationBullets: string[];
}

export interface ProjectionDiagnosticsSummary {
  diagnostics: ProjectionDiagnosticOutput[];
  generatedAt: string;
}

export interface RunProjectionDiagnosticsOutput extends ProjectionDiagnosticsSummary {
  rows: WrTeFeatureRow[];
  predictions: WrTeBaselinePrediction[];
}

export interface ScoreRegressionCandidatesOutput extends ProjectionDiagnosticsSummary {}
