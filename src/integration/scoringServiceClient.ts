import type {
  RosPlayerCardRequest,
  ScoringClientResult,
  ScoringServiceRosPlayerCard,
  ScoringServiceWeeklyCompare,
  ScoringServiceWeeklyPlayerCard,
  ScoringServiceWeeklyRankingsRow,
  WeeklyCompareRequest,
  WeeklyPlayerCardRequest,
  WeeklyRankingsRequest,
} from './scoringServiceTypes.js';

const DEFAULT_BASE_URL = 'http://localhost:3000';

interface CreateScoringClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ServiceEnvelope<T> {
  ok: boolean;
  data?: T;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const hasPlayerCardShape = (value: unknown): value is { card: ScoringServiceWeeklyPlayerCard } =>
  isObject(value) && isObject(value.card) && typeof value.card.player_id === 'string' && typeof value.card.expected_points === 'number';

const hasRankingsShape = (value: unknown): value is { view: { rows: ScoringServiceWeeklyRankingsRow[] } } =>
  isObject(value)
  && isObject(value.view)
  && Array.isArray(value.view.rows)
  && value.view.rows.every((row) => isObject(row) && typeof row.player_id === 'string' && typeof row.rank === 'number');

const hasRosCardShape = (value: unknown): value is { card: ScoringServiceRosPlayerCard } =>
  isObject(value)
  && isObject(value.card)
  && typeof value.card.player_id === 'string'
  && typeof value.card.ros_expected_points === 'number';

const hasCompareShape = (value: unknown): value is { view: ScoringServiceWeeklyCompare } =>
  isObject(value)
  && isObject(value.view)
  && typeof value.view.verdict === 'string'
  && isObject(value.view.deltas);

const buildUrl = (baseUrl: string, route: string) => `${baseUrl.replace(/\/$/, '')}${route}`;

export const createScoringServiceClient = (options: CreateScoringClientOptions = {}) => {
  const rawBaseUrl = options.baseUrl ?? process.env.SCORING_SERVICE_BASE_URL ?? DEFAULT_BASE_URL;
  const fetchImpl = options.fetchImpl ?? fetch;

  const call = async <T>(route: string, body: unknown): Promise<ScoringClientResult<T>> => {
    if (!rawBaseUrl || rawBaseUrl.trim().length === 0) {
      return { ok: false, reason: 'missing_base_url', message: 'SCORING_SERVICE_BASE_URL is not configured.' };
    }

    let response: Response;
    try {
      response = await fetchImpl(buildUrl(rawBaseUrl, route), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      return {
        ok: false,
        reason: 'network_error',
        message: `Failed to call scoring service route ${route}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        reason: 'http_error',
        status: response.status,
        message: `Scoring service route ${route} returned HTTP ${response.status}.`,
      };
    }

    const envelope = (await response.json().catch(() => null)) as ServiceEnvelope<T> | null;
    if (!envelope?.ok || envelope.data === undefined) {
      return { ok: false, reason: 'invalid_payload', message: `Scoring service route ${route} returned invalid payload.` };
    }

    return { ok: true, data: envelope.data };
  };

  const getWeeklyPlayerCard = async (request: WeeklyPlayerCardRequest): Promise<ScoringClientResult<ScoringServiceWeeklyPlayerCard>> => {
    const response = await call<{ card: ScoringServiceWeeklyPlayerCard }>('/api/tiber/weekly/player-card', request);
    if (!response.ok) return response;
    if (!hasPlayerCardShape(response.data)) {
      return { ok: false, reason: 'invalid_payload', message: 'Weekly player card payload was malformed.' };
    }
    return { ok: true, data: response.data.card };
  };

  const getWeeklyRankings = async (request: WeeklyRankingsRequest): Promise<ScoringClientResult<ScoringServiceWeeklyRankingsRow[]>> => {
    const response = await call<{ view: { rows: ScoringServiceWeeklyRankingsRow[] } }>('/api/tiber/weekly/rankings', request);
    if (!response.ok) return response;
    if (!hasRankingsShape(response.data)) {
      return { ok: false, reason: 'invalid_payload', message: 'Weekly rankings payload was malformed.' };
    }
    return { ok: true, data: response.data.view.rows };
  };

  const getRosPlayerCard = async (request: RosPlayerCardRequest): Promise<ScoringClientResult<ScoringServiceRosPlayerCard>> => {
    const response = await call<{ card: ScoringServiceRosPlayerCard }>('/api/tiber/ros/player-card', request);
    if (!response.ok) return response;
    if (!hasRosCardShape(response.data)) {
      return { ok: false, reason: 'invalid_payload', message: 'ROS player card payload was malformed.' };
    }
    return { ok: true, data: response.data.card };
  };

  const getWeeklyCompare = async (request: WeeklyCompareRequest): Promise<ScoringClientResult<ScoringServiceWeeklyCompare>> => {
    const response = await call<{ view: ScoringServiceWeeklyCompare }>('/api/tiber/weekly/compare', request);
    if (!response.ok) return response;
    if (!hasCompareShape(response.data)) {
      return { ok: false, reason: 'invalid_payload', message: 'Weekly compare payload was malformed.' };
    }
    return { ok: true, data: response.data.view };
  };

  return {
    getWeeklyPlayerCard,
    getWeeklyRankings,
    getRosPlayerCard,
    getWeeklyCompare,
  };
};

export type ScoringServiceClient = ReturnType<typeof createScoringServiceClient>;
