import { Hono } from 'hono';
import { sampleDecisionBoardRun } from '../../board/examples/sampleDecisionBoardRun.js';

export const registerDecisionBoardRoutes = (app: Hono) => {
  app.get('/api/decision-board/mock', (c) => {
    if (!sampleDecisionBoardRun.ok) {
      return c.json(
        {
          ok: false,
          error: 'Mock decision board data is unavailable.',
          details: sampleDecisionBoardRun.errors,
        },
        500,
      );
    }

    return c.json({
      ok: true,
      source: 'sampleDecisionBoardRun',
      generatedAt: sampleDecisionBoardRun.data.generatedAt,
      rows: sampleDecisionBoardRun.data.rows,
    });
  });
};
