import { Hono } from 'hono';

export const registerHealthRoutes = (app: Hono) => {
  app.get('/health', (c) => c.json({ ok: true, service: 'tiber-fantasy-scoring-engine' }));
};
