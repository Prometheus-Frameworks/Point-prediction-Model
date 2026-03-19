import { actionTierOrder } from '../types/actionTier.js';
import type { DecisionBoardRow } from '../types/decisionBoardRow.js';

const tierScore = (tier: DecisionBoardRow['actionTier']): number => actionTierOrder.indexOf(tier);

export const sortDecisionBoard = (rows: DecisionBoardRow[]): DecisionBoardRow[] => [...rows].sort((left, right) => {
  if (tierScore(left.actionTier) !== tierScore(right.actionTier)) {
    return tierScore(left.actionTier) - tierScore(right.actionTier);
  }

  if (right.actionabilityScore !== left.actionabilityScore) {
    return right.actionabilityScore - left.actionabilityScore;
  }

  if (right.compositeSignalScore !== left.compositeSignalScore) {
    return right.compositeSignalScore - left.compositeSignalScore;
  }

  if (right.trustworthinessScore !== left.trustworthinessScore) {
    return right.trustworthinessScore - left.trustworthinessScore;
  }

  if (Math.abs(right.marketEdgeScore) !== Math.abs(left.marketEdgeScore)) {
    return Math.abs(right.marketEdgeScore) - Math.abs(left.marketEdgeScore);
  }

  return right.fusedPointPrediction - left.fusedPointPrediction;
});
