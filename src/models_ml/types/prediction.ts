import type { GroupedMetrics, PredictionRecord } from '../../datasets/types/metrics.js';
import type { WrTeFeatureRow } from '../../features/types/featureRow.js';

export interface WrTeBaselinePrediction {
  rowId: string;
  playerId: string;
  playerName: string;
  position: WrTeFeatureRow['player_position'];
  predictedPpr: number;
}

export interface ModelPredictionSet {
  model: string;
  predictions: PredictionRecord[];
  metrics: GroupedMetrics;
}

export interface PredictionComparisonRow {
  model: string;
  mae: number;
  rmse: number;
  correlation: number | null;
  rankCorrelation: number | null;
  sampleSize: number;
  maeDeltaVsBaselineMean: number | null;
  rmseDeltaVsBaselineMean: number | null;
}
