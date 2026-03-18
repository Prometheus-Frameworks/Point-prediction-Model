import type { WrTeLabeledRow } from '../types/labeledRow.js';
import { baselineMeanModel, type BenchmarkModel } from './baselineMeanModel.js';

const weightedAverage = (values: Array<{ value: number; weight: number }>) => {
  const weightSum = values.reduce((sum, entry) => sum + entry.weight, 0);
  return values.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / weightSum;
};

export const baselineRecentTrendModel = (trainRows: WrTeLabeledRow[]): BenchmarkModel => {
  const fallback = baselineMeanModel(trainRows);

  return {
    name: 'baseline-recent-trend',
    predict: (row) => {
      const candidate = weightedAverage([
        { value: row.efficiency_fantasy_points_pg_trailing5, weight: 0.5 },
        { value: row.usage_targets_pg_trailing3 * 1.55, weight: 0.2 },
        { value: row.usage_targets_pg_trailing5 * 1.45, weight: 0.1 },
        { value: row.efficiency_fantasy_points_delta_vs_baseline + row.efficiency_fantasy_points_pg_trailing5, weight: 0.2 },
      ]);

      return Number.isFinite(candidate) ? Math.max(0, candidate) : fallback.predict(row);
    },
  };
};
