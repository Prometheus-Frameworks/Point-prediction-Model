import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerDecisionBoardRoutes } from './routes/decisionBoard.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerProjectScenarioRoutes } from './routes/projectScenarios.js';
import { registerScenarioRoutes } from './routes/scenarios.js';

export const createApp = () => {
  const app = new Hono();

  app.use('/api/*', cors());
  app.use('/health', cors());

  registerHealthRoutes(app);
  registerDecisionBoardRoutes(app);
  registerScenarioRoutes(app);
  registerProjectScenarioRoutes(app);

  app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));

  return app;
};
