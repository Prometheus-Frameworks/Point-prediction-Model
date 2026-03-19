import { useEffect, useMemo, useState } from 'react';
import { fetchDecisionBoard } from '../api/decisionBoard';
import { mockDecisionBoard } from '../data/mockDecisionBoard';
import type { DecisionBoardPlayer } from '../types';

interface DecisionBoardState {
  data: DecisionBoardPlayer[];
  isLoading: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  sourceLabel: string;
  usingFallback: boolean;
}

const defaultState: DecisionBoardState = {
  data: [],
  isLoading: true,
  isEmpty: false,
  sourceLabel: 'Loading live API',
  usingFallback: false,
};

export const useDecisionBoard = () => {
  const [state, setState] = useState<DecisionBoardState>(defaultState);

  useEffect(() => {
    let isMounted = true;

    const loadDecisionBoard = async () => {
      setState(defaultState);

      try {
        const rows = await fetchDecisionBoard();

        if (!isMounted) {
          return;
        }

        if (rows.length === 0) {
          setState({
            data: [],
            isLoading: false,
            isEmpty: true,
            sourceLabel: 'Live API returned no decision-board rows',
            usingFallback: false,
          });
          return;
        }

        setState({
          data: rows,
          isLoading: false,
          isEmpty: false,
          sourceLabel: 'Live API · /api/decision-board/mock',
          usingFallback: false,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load the decision board.';

        setState({
          data: mockDecisionBoard,
          isLoading: false,
          errorMessage: `${message} Showing local fallback data instead.`,
          isEmpty: false,
          sourceLabel: 'Local fallback mock data',
          usingFallback: true,
        });
      }
    };

    void loadDecisionBoard();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => state, [state]);
};
