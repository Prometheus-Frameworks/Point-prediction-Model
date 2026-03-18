import type { CombinedRegressionScores, RegressionComponentScores } from '../types/regressionSignal.js';
import { blend, finalizeScore } from './shared.js';

export const combineRegressionScores = (components: RegressionComponentScores): CombinedRegressionScores => {
  const regressionUpScore = finalizeScore(blend(
    [components.usageProductionGap.direction === 'up' ? components.usageProductionGap.score : 0, 0.45],
    [components.tdRegressionRisk.upScore, 0.2],
    [components.efficiencyFragility.direction === 'up' ? 100 - components.efficiencyFragility.score : 0, 0.15],
    [components.volumeStability.stabilityScore, 0.1],
    [100 - components.projectionStickiness.fragilityScore, 0.1],
  ));

  const regressionDownScore = finalizeScore(blend(
    [components.usageProductionGap.direction === 'down' ? components.usageProductionGap.score : 0, 0.2],
    [components.efficiencyFragility.score, 0.35],
    [components.tdRegressionRisk.downScore, 0.25],
    [components.volumeStability.fragilityScore, 0.1],
    [components.projectionStickiness.fragilityScore, 0.1],
  ));

  const stickinessScore = finalizeScore(blend(
    [components.volumeStability.stabilityScore, 0.45],
    [components.projectionStickiness.stickinessScore, 0.55],
  ));

  const fragilityScore = finalizeScore(blend(
    [components.volumeStability.fragilityScore, 0.35],
    [components.projectionStickiness.fragilityScore, 0.4],
    [components.efficiencyFragility.score, 0.15],
    [components.tdRegressionRisk.downScore, 0.1],
  ));

  return {
    regressionUpScore,
    regressionDownScore,
    stickinessScore,
    fragilityScore,
  };
};
