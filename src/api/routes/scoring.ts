import { Hono } from 'hono';
import type { LeagueContextInput, PlayerOpportunityInput, RosScoringRequest, WeeklyScoringRequest } from '../../contracts/scoring.js';
import { generateReplacementBaselinesService } from '../../services/scoring/generateReplacementBaselinesService.js';
import { rankWeeklyScoringService } from '../../services/scoring/rankWeeklyScoringService.js';
import { scoreRosService } from '../../services/scoring/scoreRosService.js';
import { scoreWeeklyBatchService } from '../../services/scoring/scoreWeeklyBatchService.js';
import { scoreWeeklyPlayerService } from '../../services/scoring/scoreWeeklyPlayerService.js';

export const registerScoringRoutes = (app: Hono) => {
  app.post('/api/scoring/weekly/player', async (c) => {
    const body = (await c.req.json().catch(() => null)) as { player?: PlayerOpportunityInput; league_context?: LeagueContextInput } | null;

    if (!body?.player || !body.league_context) {
      return c.json({ ok: false, error: 'Body must include player and league_context.' }, 400);
    }

    const result = scoreWeeklyPlayerService({ players: [body.player], league_context: body.league_context });
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/scoring/weekly/batch', async (c) => {
    const body = (await c.req.json().catch(() => null)) as WeeklyScoringRequest | null;
    if (!body?.players || !body.league_context) {
      return c.json({ ok: false, error: 'Body must include players and league_context.' }, 400);
    }

    const result = scoreWeeklyBatchService(body);
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/scoring/replacement', async (c) => {
    const body = (await c.req.json().catch(() => null)) as { players?: PlayerOpportunityInput[]; league_context?: LeagueContextInput } | null;

    if (!body?.players || !body.league_context) {
      return c.json({ ok: false, error: 'Body must include players and league_context.' }, 400);
    }

    const result = generateReplacementBaselinesService(body.players, body.league_context);
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/scoring/weekly/rankings', async (c) => {
    const body = (await c.req.json().catch(() => null)) as WeeklyScoringRequest | null;

    if (!body?.players || !body.league_context) {
      return c.json({ ok: false, error: 'Body must include players and league_context.' }, 400);
    }

    const result = rankWeeklyScoringService(body);
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/scoring/ros', async (c) => {
    const body = (await c.req.json().catch(() => null)) as RosScoringRequest | null;
    if (!body?.players || !body.league_context || typeof body.remaining_weeks !== 'number') {
      return c.json({ ok: false, error: 'Body must include players, league_context, and remaining_weeks.' }, 400);
    }

    const result = scoreRosService(body);
    return c.json(result, result.ok ? 200 : 400);
  });
};
