import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerDecisionBoardRoutes } from './routes/decisionBoard.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerProjectScenarioRoutes } from './routes/projectScenarios.js';
import { registerScenarioRoutes } from './routes/scenarios.js';

const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const parseAllowedOrigins = () => {
  const configuredOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length ? configuredOrigins : defaultAllowedOrigins;
};

export const createApp = () => {
  const app = new Hono();
  const allowedOrigins = parseAllowedOrigins();

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) {
          return origin;
        }

        return allowedOrigins.includes(origin) ? origin : null;
      },
    }),
  );

  app.get('/', (c) =>
    c.json({
      ok: true,
      service: 'point-prediction-model',
      description: 'WR/TE projection, diagnostics, fusion, and market-edge API',
      endpoints: {
        health: '/health',
        scenarios: '/api/scenarios',
        decisionBoardMock: '/api/decision-board/mock',
        projectScenarios: '/api/project/scenarios',
      },
    }),
  );

  registerHealthRoutes(app);
  registerDecisionBoardRoutes(app);
  registerScenarioRoutes(app);
  registerProjectScenarioRoutes(app);

  app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));

  return app;
};
