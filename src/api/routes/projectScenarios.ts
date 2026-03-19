import { Hono } from 'hono';
import { projectBatch } from '../../services/projectBatchService.js';
import type { ProjectionScenario } from '../../types/scenario.js';

interface ProjectScenariosBody {
  scenarios?: ProjectionScenario[];
}

export const registerProjectScenarioRoutes = (app: Hono) => {
  app.post('/api/project/scenarios', async (c) => {
    const body = (await c.req.json().catch(() => null)) as ProjectScenariosBody | ProjectionScenario[] | null;
    const scenarios = Array.isArray(body) ? body : body?.scenarios;

    if (!Array.isArray(scenarios)) {
      return c.json(
        {
          ok: false,
          error: 'Request body must be a ProjectionScenario array or an object with a scenarios array.',
        },
        400,
      );
    }

    const result = projectBatch(scenarios);
    return c.json(result, result.ok ? 200 : 400);
  });
};
