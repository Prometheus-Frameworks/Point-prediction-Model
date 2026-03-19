import type { DecisionBoardInputs, DecisionDirection } from '../types/decisionBoardRow.js';
import { clamp, roundTo } from '../../utils/math.js';

export interface CompositeSignalBreakdown {
  marketComponent: number;
  regressionComponent: number;
  fusionComponent: number;
  stickinessSupport: number;
  fragilityPenalty: number;
  intervalPenalty: number;
  alignmentBonus: number;
  directionalSignal: number;
}

export interface CompositeSignalScore {
  score: number;
  direction: DecisionDirection;
  breakdown: CompositeSignalBreakdown;
}

export const scoreCompositeSignal = ({ diagnostics, fusedProjection, marketEdge }: DecisionBoardInputs): CompositeSignalScore => {
  const marketSignal = marketEdge?.trustAdjustedEdgeScore ?? marketEdge?.rawEdgeScore ?? 0;
  const netRegressionSignal = diagnostics.regressionUpScore - diagnostics.regressionDownScore;
  const fusionSignal = fusedProjection.appliedDelta * 8;
  const directionalSignal = marketSignal * 1.05 + netRegressionSignal * 0.75 + fusionSignal;

  const marketComponent = clamp(Math.abs(marketSignal) * 0.72, 0, 34);
  const regressionComponent = clamp(Math.abs(netRegressionSignal) * 0.64, 0, 30);
  const fusionComponent = clamp(Math.abs(fusedProjection.appliedDelta) * 5.4, 0, 18);
  const stickinessSupport = clamp(diagnostics.stickinessScore * 0.12, 0, 10);
  const fragilityPenalty = clamp(diagnostics.fragilityScore * 0.16, 0, 14);
  const intervalPenalty = clamp((diagnostics.intervalWidth90 - 10) * 0.7, 0, 8);

  const marketDirection = Math.sign(marketSignal);
  const regressionDirection = Math.sign(netRegressionSignal);
  const fusionDirection = Math.sign(fusedProjection.appliedDelta);
  const alignedDirections = [marketDirection, regressionDirection, fusionDirection].filter((value) => value !== 0);
  const allAligned = alignedDirections.length >= 2 && alignedDirections.every((value) => value === alignedDirections[0]);
  const mixedSignal = new Set(alignedDirections).size > 1;
  const alignmentBonus = allAligned ? 8 : mixedSignal ? -4 : 0;

  const score = clamp(
    18 + marketComponent + regressionComponent + fusionComponent + stickinessSupport + alignmentBonus
      - fragilityPenalty - intervalPenalty,
    0,
    100,
  );

  const direction: DecisionDirection = Math.abs(directionalSignal) < 12
    ? 'NEUTRAL'
    : directionalSignal > 0
      ? 'UPSIDE'
      : 'DOWNSIDE';

  return {
    score: roundTo(score),
    direction,
    breakdown: {
      marketComponent: roundTo(marketComponent),
      regressionComponent: roundTo(regressionComponent),
      fusionComponent: roundTo(fusionComponent),
      stickinessSupport: roundTo(stickinessSupport),
      fragilityPenalty: roundTo(fragilityPenalty),
      intervalPenalty: roundTo(intervalPenalty),
      alignmentBonus: roundTo(alignmentBonus),
      directionalSignal: roundTo(directionalSignal),
    },
  };
};
