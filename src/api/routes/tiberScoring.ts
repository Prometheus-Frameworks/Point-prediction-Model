import { Hono } from 'hono';
import type { RosScoringRequest, WeeklyScoringRequest } from '../../contracts/scoring.js';
import type { TiberWeeklyCompareRequest } from '../../contracts/tiberScoring.js';
import {
  buildRosPlayerCardService,
  buildWeeklyCompareViewService,
  buildWeeklyPlayerCardService,
  buildWeeklyRankingsViewService,
} from '../../services/scoring/buildTiberViewsService.js';
import type { ServiceResult } from '../../services/result.js';

const badRequest = (message: string): ServiceResult<never> => ({
  ok: false,
  warnings: [],
  errors: [{ code: 'BAD_REQUEST', message }],
});

const hasLeagueAndPlayers = (body: WeeklyScoringRequest | null): body is WeeklyScoringRequest =>
  Boolean(body?.league_context && Array.isArray(body.players));

export const registerTiberScoringRoutes = (app: Hono) => {
  app.post('/api/tiber/weekly/player-card', async (c) => {
    const body = (await c.req.json().catch(() => null)) as WeeklyScoringRequest | null;

    if (!hasLeagueAndPlayers(body)) {
      return c.json(badRequest('Body must include players array and league_context.'), 400);
    }

    if (body.players.length !== 1) {
      return c.json(badRequest('Weekly player card expects exactly one player.'), 400);
    }

    const result = buildWeeklyPlayerCardService(body);
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/tiber/weekly/rankings', async (c) => {
    const body = (await c.req.json().catch(() => null)) as WeeklyScoringRequest | null;

    if (!hasLeagueAndPlayers(body) || body.players.length === 0) {
      return c.json(badRequest('Body must include a non-empty players array and league_context.'), 400);
    }

    const result = buildWeeklyRankingsViewService(body);
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/tiber/ros/player-card', async (c) => {
    const body = (await c.req.json().catch(() => null)) as RosScoringRequest | null;

    if (!body?.league_context || !Array.isArray(body.players) || typeof body.remaining_weeks !== 'number') {
      return c.json(badRequest('Body must include players array, league_context, and remaining_weeks.'), 400);
    }

    if (body.players.length !== 1) {
      return c.json(badRequest('ROS player card expects exactly one player.'), 400);
    }

    const result = buildRosPlayerCardService(body);
    return c.json(result, result.ok ? 200 : 400);
  });

  app.post('/api/tiber/weekly/compare', async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      player_a?: TiberWeeklyCompareRequest['player_a'];
      player_b?: TiberWeeklyCompareRequest['player_b'];
      league_context?: WeeklyScoringRequest['league_context'];
      comparison_pool?: WeeklyScoringRequest['comparison_pool'];
      replacement_points_override?: WeeklyScoringRequest['replacement_points_override'];
    } | null;

    if (!body?.player_a || !body.player_b || !body.league_context) {
      return c.json(badRequest('Body must include player_a, player_b, and league_context.'), 400);
    }

    const result = buildWeeklyCompareViewService({
      player_a: body.player_a,
      player_b: body.player_b,
      league_context: body.league_context,
      comparison_pool: body.comparison_pool,
      replacement_points_override: body.replacement_points_override,
    });

    return c.json(result, result.ok ? 200 : 400);
  });
};
