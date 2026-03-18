import type { WrTeLabeledRow } from './labeledRow.js';
import type { RollingBacktestWindow } from './split.js';

export interface PredictionRecord {
  model: string;
  rowId: string;
  playerId: string;
  playerName: string;
  position: WrTeLabeledRow['player_position'];
  eventType: WrTeLabeledRow['event_type'];
  season: number;
  week: number;
  predicted: number;
  actual: number;
  absoluteError: number;
  squaredError: number;
}

export interface EvaluationMetrics {
  sampleSize: number;
  mae: number;
  rmse: number;
  correlation: number | null;
  rankCorrelation: number | null;
}

export interface GroupedMetrics {
  overall: EvaluationMetrics;
  byPosition: Partial<Record<WrTeLabeledRow['player_position'], EvaluationMetrics>>;
  byEventPresence: {
    withEvent?: EvaluationMetrics;
    withoutEvent?: EvaluationMetrics;
  };
}

export interface WindowEvaluation {
  windowIndex: number;
  model: string;
  metrics: GroupedMetrics;
  predictions: PredictionRecord[];
  window: RollingBacktestWindow;
}

export interface AggregatedMetricsSummary extends GroupedMetrics {
  predictions: PredictionRecord[];
}

export interface BacktestModelReport {
  model: string;
  overall: GroupedMetrics;
  byWindow: Array<{
    windowIndex: number;
    trainRange: string;
    testRange: string;
    metrics: GroupedMetrics;
  }>;
  topMisses: PredictionRecord[];
}

export interface BacktestReport {
  datasetSize: number;
  windowCount: number;
  generatedAt: string;
  models: BacktestModelReport[];
}
