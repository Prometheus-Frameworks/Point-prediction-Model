import type { ProjectionBreakdown } from '../types/projection.js';

export const summarizeDelta = (baseline: ProjectionBreakdown, adjusted: ProjectionBreakdown): string[] => [
  `Targets/G: ${baseline.targetsPerGame} → ${adjusted.targetsPerGame}.`,
  `Receptions/G: ${baseline.receptionsPerGame} → ${adjusted.receptionsPerGame}.`,
  `Yards/G: ${baseline.yardsPerGame} → ${adjusted.yardsPerGame}.`,
  `TDs/G: ${baseline.tdsPerGame} → ${adjusted.tdsPerGame}.`,
];
