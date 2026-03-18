import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../../features/types/sourceTypes.js';

export interface WeeklyPprTarget {
  season: number;
  week: number;
  playedAt: string;
  receptions: number;
  receivingYards: number;
  touchdowns: number;
  fantasyPointsPpr: number;
}

export interface HistoricalRowMetadata {
  inputId: string;
  rowId: string;
  builtAt: string;
  trainingCutoffTimestamp: string;
  labelSource: 'weekly-actual-ppr';
  priorGamesUsed: number;
  eventApplied: boolean;
  leakChecksPassed: true;
}

export interface HistoricalLabeledRowInput {
  inputId: string;
  source: WrTeFeatureSourceInput;
  actual: WeeklyPprTarget;
  metadata?: {
    builtAt?: string;
  };
}

export interface WrTeLabeledRow extends WrTeFeatureRow {
  labeled_row_version: 'wrte-weekly-labeled-v1';
  row_id: string;
  label_season: number;
  label_week: number;
  label_played_at: string;
  target_fantasy_points_ppr: number;
  target_receptions: number;
  target_receiving_yards: number;
  target_touchdowns: number;
  build_metadata: HistoricalRowMetadata;
}
