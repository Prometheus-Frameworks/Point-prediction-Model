import type {
  ConfidenceBand,
  FragilityTag,
  LeagueContextInput,
  PlayerOpportunityInput,
  ReplacementPointsOverride,
  ScoringPosition,
  VolatilityTag,
} from '../contracts/scoring.js';

export interface ScoringServiceWeeklyPlayerCard {
  player_id: string;
  player_name: string;
  team: string;
  position: ScoringPosition;
  expected_points: number;
  vorp: number;
  floor: number;
  median: number;
  ceiling: number;
  confidence_band: ConfidenceBand;
  volatility_tag: VolatilityTag;
  fragility_tag: FragilityTag;
  weekly_outlook: string;
  role_summary: string;
  value_summary: string;
  role_notes: string[];
}

export interface ScoringServiceWeeklyRankingsRow {
  rank: number;
  player_id: string;
  player_name: string;
  team: string;
  position: ScoringPosition;
  expected_points: number;
  vorp: number;
  floor: number;
  ceiling: number;
  confidence_band: ConfidenceBand;
  weekly_outlook: string;
}

export interface ScoringServiceRosPlayerCard extends ScoringServiceWeeklyPlayerCard {
  ros_expected_points: number;
  ros_vorp: number;
}

export interface ScoringServiceWeeklyCompare {
  verdict: 'lean_a' | 'lean_b' | 'close';
  player_a: ScoringServiceWeeklyPlayerCard;
  player_b: ScoringServiceWeeklyPlayerCard;
  deltas: {
    expected_points: number;
    vorp: number;
    floor: number;
    ceiling: number;
  };
}

export interface TiberPlayerSnapshot {
  id: string;
  name: string;
  team: string;
  position: ScoringPosition;
  gamesSampled: number;
  passing?: {
    attemptsPerGame: number;
    yardsPerAttempt: number;
    tdRate: number;
    interceptionRate: number;
  };
  rushing?: {
    attemptsPerGame: number;
    yardsPerAttempt: number;
    tdRate: number;
  };
  receiving?: {
    routesPerGame: number;
    targetsPerRoute: number;
    catchRate: number;
    yardsPerTarget: number;
    tdRate: number;
  };
  risk?: {
    roleStability?: number;
    tdDependency?: number;
    injuryRisk?: number;
  };
}

export interface TiberLeagueSettings {
  teams: number;
  starters: LeagueContextInput['starters'];
  replacementBuffer?: number;
}

export interface WeeklyPlayerCardRequest {
  players: [PlayerOpportunityInput];
  league_context: LeagueContextInput;
  comparison_pool?: PlayerOpportunityInput[];
  replacement_points_override?: ReplacementPointsOverride;
}

export interface WeeklyRankingsRequest {
  players: PlayerOpportunityInput[];
  league_context: LeagueContextInput;
  comparison_pool?: PlayerOpportunityInput[];
  replacement_points_override?: ReplacementPointsOverride;
}

export interface RosPlayerCardRequest extends WeeklyPlayerCardRequest {
  remaining_weeks: number;
}

export interface WeeklyCompareRequest {
  player_a: PlayerOpportunityInput;
  player_b: PlayerOpportunityInput;
  league_context: LeagueContextInput;
  comparison_pool?: PlayerOpportunityInput[];
  replacement_points_override?: ReplacementPointsOverride;
}

export type ScoringClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'missing_base_url' | 'network_error' | 'http_error' | 'invalid_payload'; message: string; status?: number };
