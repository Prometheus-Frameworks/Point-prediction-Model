import { Hono } from 'hono';
import { scenarioRegistry } from '../../models/scenarios/registry.js';

const seededScenarios = scenarioRegistry.map((scenario) => ({
  id: scenario.metadata.id,
  title: scenario.metadata.title,
  description: scenario.metadata.description,
  tags: scenario.metadata.tags,
  defaultRun: scenario.metadata.defaultRun,
  player: {
    id: scenario.player.id,
    name: scenario.player.name,
    position: scenario.player.position,
    team: scenario.player.team,
  },
  eventType: scenario.event.type,
  effectiveWeek: scenario.event.effectiveWeek,
  severity: scenario.event.severity,
}));

export const registerScenarioRoutes = (app: Hono) => {
  app.get('/api/scenarios', (c) => c.json({ ok: true, count: seededScenarios.length, scenarios: seededScenarios }));
};
