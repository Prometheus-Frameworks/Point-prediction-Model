import { serve } from '@hono/node-server';
import { createApp } from './api/app.js';

const fallbackPort = 3000;
const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const port = Number.isFinite(parsedPort) ? parsedPort : fallbackPort;

const app = createApp();

console.log(`Starting point-prediction-model API on port ${port}.`);

serve({
  fetch: app.fetch,
  port,
});
