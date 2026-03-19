import type { ActionTier } from '../types/actionTier.js';
import type { DecisionDirection } from '../types/decisionBoardRow.js';
import { clamp, roundTo } from '../../utils/math.js';

export interface ActionabilityScoreInput {
  compositeSignalScore: number;
  trustworthinessScore: number;
  direction: DecisionDirection;
  marketEdgeScore: number;
  intervalWidth90: number;
}

export interface ActionabilityScore {
  score: number;
  tier: ActionTier;
}

export const assignActionTier = (
  score: number,
  trustworthinessScore: number,
  compositeSignalScore: number,
  direction: DecisionDirection,
): ActionTier => {
  if (direction === 'NEUTRAL' && score < 45) {
    return 'PASS';
  }

  if (score >= 78 && trustworthinessScore >= 65 && compositeSignalScore >= 72 && direction !== 'NEUTRAL') {
    return 'ELITE_SIGNAL';
  }

  if (score >= 62 && trustworthinessScore >= 50 && compositeSignalScore >= 56 && direction !== 'NEUTRAL') {
    return 'STRONG_SIGNAL';
  }

  if (score >= 45 && compositeSignalScore >= 42) {
    return direction === 'NEUTRAL' ? 'CAUTION' : 'WATCHLIST';
  }

  if (trustworthinessScore < 40 || compositeSignalScore >= 35) {
    return 'CAUTION';
  }

  return 'PASS';
};

export const scoreActionability = ({
  compositeSignalScore,
  trustworthinessScore,
  direction,
  marketEdgeScore,
  intervalWidth90,
}: ActionabilityScoreInput): ActionabilityScore => {
  const magnitudeSupport = clamp(Math.abs(marketEdgeScore) * 0.45, 0, 18);
  const confidenceMultiplier = 0.45 + trustworthinessScore / 100 * 0.55;
  const intervalPenalty = clamp((intervalWidth90 - 10) * 1.2, 0, 14);
  const directionPenalty = direction === 'NEUTRAL' ? 18 : 0;

  const score = clamp(
    ((Math.max(0, compositeSignalScore - 20) * 0.95) + magnitudeSupport) * confidenceMultiplier
      + trustworthinessScore * 0.24
      - intervalPenalty
      - directionPenalty,
    0,
    100,
  );

  return {
    score: roundTo(score),
    tier: assignActionTier(roundTo(score), trustworthinessScore, compositeSignalScore, direction),
  };
};
