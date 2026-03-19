import { rankDecisionBoard, type RankDecisionBoardOptions, type RankedDecisionBoardRow } from '../board/ranking/rankDecisionBoard.js';
import type { DecisionBoardRow } from '../board/types/decisionBoardRow.js';
import { serviceFailure, serviceSuccess } from './result.js';
import type { RankDecisionBoardResult } from './types.js';

export interface RankDecisionBoardOutput {
  rows: RankedDecisionBoardRow[];
  generatedAt: string;
}

export const rankDecisionBoardService = (
  rows: DecisionBoardRow[],
  options: RankDecisionBoardOptions & { generatedAt?: string } = {},
): RankDecisionBoardResult => {
  try {
    return serviceSuccess({
      rows: rankDecisionBoard(rows, options),
      generatedAt: options.generatedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    return serviceFailure({
      code: 'DECISION_BOARD_RANK_FAILED',
      message: error instanceof Error ? error.message : 'Unknown decision board ranking error.',
    });
  }
};
