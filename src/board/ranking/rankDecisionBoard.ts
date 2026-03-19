import type { DecisionBoardRow } from '../types/decisionBoardRow.js';
import { filterDecisionBoard, type FilterDecisionBoardOptions } from './filterDecisionBoard.js';
import { sortDecisionBoard } from './sortDecisionBoard.js';

export interface RankedDecisionBoardRow extends DecisionBoardRow {
  rank: number;
}

export interface RankDecisionBoardOptions extends FilterDecisionBoardOptions {}

export const rankDecisionBoard = (
  rows: DecisionBoardRow[],
  options: RankDecisionBoardOptions = {},
): RankedDecisionBoardRow[] => sortDecisionBoard(filterDecisionBoard(rows, options)).map((row, index) => ({
  ...row,
  rank: index + 1,
}));
