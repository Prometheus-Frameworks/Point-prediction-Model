import type { ActionTier } from '../types/actionTier.js';
import type { DecisionBoardRow, DecisionDirection, DecisionTag } from '../types/decisionBoardRow.js';

export interface FilterDecisionBoardOptions {
  directions?: DecisionDirection[];
  actionTiers?: ActionTier[];
  includeTags?: DecisionTag[];
  excludeTags?: DecisionTag[];
  minimumCompositeSignalScore?: number;
  minimumActionabilityScore?: number;
  minimumTrustworthinessScore?: number;
}

export const filterDecisionBoard = (
  rows: DecisionBoardRow[],
  options: FilterDecisionBoardOptions = {},
): DecisionBoardRow[] => rows.filter((row) => {
  if (options.directions && !options.directions.includes(row.direction)) {
    return false;
  }

  if (options.actionTiers && !options.actionTiers.includes(row.actionTier)) {
    return false;
  }

  if (options.includeTags && !options.includeTags.every((tag) => row.decisionTags.includes(tag))) {
    return false;
  }

  if (options.excludeTags && options.excludeTags.some((tag) => row.decisionTags.includes(tag))) {
    return false;
  }

  if (options.minimumCompositeSignalScore !== undefined && row.compositeSignalScore < options.minimumCompositeSignalScore) {
    return false;
  }

  if (options.minimumActionabilityScore !== undefined && row.actionabilityScore < options.minimumActionabilityScore) {
    return false;
  }

  if (options.minimumTrustworthinessScore !== undefined && row.trustworthinessScore < options.minimumTrustworthinessScore) {
    return false;
  }

  return true;
});
