import { getJson } from './client';
import type { DecisionBoardPlayer } from '../types';

interface DecisionBoardResponse {
  ok: boolean;
  rows?: DecisionBoardPlayer[];
  error?: string;
}

export const fetchDecisionBoard = async (): Promise<DecisionBoardPlayer[]> => {
  const payload = await getJson<DecisionBoardResponse>('/api/decision-board/mock');

  if (!payload.ok) {
    throw new Error(payload.error || 'Decision board request was not successful.');
  }

  return Array.isArray(payload.rows) ? payload.rows : [];
};
