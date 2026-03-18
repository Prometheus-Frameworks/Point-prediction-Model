import { clamp, roundTo } from '../../utils/math.js';
import type { FeatureWindowSummary, WrTeFeatureSourceInput } from '../types/sourceTypes.js';

export const toDate = (value: string): Date => new Date(value);

export const weeksBetween = (earlier: string, later: string): number => {
  const ms = toDate(later).getTime() - toDate(earlier).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 7));
};

export const summarizeStdDev = (values: number[]): number => {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const getDefenseRankForPosition = (input: WrTeFeatureSourceInput): number =>
  input.player.position === 'TE' ? input.matchup.defenseVsTeRank : input.matchup.defenseVsWrRank;

export const roundFeature = (value: number): number => roundTo(value, 4);

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const usageGrowth = (current: FeatureWindowSummary, baseline: FeatureWindowSummary, key: 'targetShare' | 'yardsPerRouteRun') =>
  roundFeature(current[key] - baseline[key]);
