import type { WrTeLabeledRow } from '../types/labeledRow.js';
import { baselineMeanModel, type BenchmarkModel } from './baselineMeanModel.js';

export const baselineUsageModel = (trainRows: WrTeLabeledRow[]): BenchmarkModel => {
  const fallback = baselineMeanModel(trainRows);

  return {
    name: 'baseline-usage',
    predict: (row) => {
      const receptionsEstimate = row.usage_targets_pg_trailing5 * row.efficiency_catch_rate_trailing5;
      const yardageEstimate = row.usage_targets_pg_trailing5 * row.efficiency_yards_per_target_trailing5;
      const touchdownEstimate = row.usage_targets_pg_trailing5 * row.efficiency_td_per_target_trailing5;
      const heuristic = receptionsEstimate + yardageEstimate / 10 + touchdownEstimate * 6;

      return Number.isFinite(heuristic) ? Math.max(0, heuristic) : fallback.predict(row);
    },
  };
};
