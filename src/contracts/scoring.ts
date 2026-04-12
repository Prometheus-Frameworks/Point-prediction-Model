export type ScoringPosition = 'QB' | 'RB' | 'WR' | 'TE';

export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';
export type VolatilityTag = 'STABLE' | 'MODERATE' | 'VOLATILE';
export type FragilityTag = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PlayerOpportunityInput {
  player_id: string;
  player_name: string;
  team: string;
  position: ScoringPosition;
  week?: number;
  season?: number;
  games_sampled: number;
  injury_risk?: number;

  pass_attempts_pg?: number;
  pass_yards_per_attempt?: number;
  pass_td_rate?: number;
  interception_rate?: number;
  rush_attempts_pg?: number;
  designed_rush_attempts_pg?: number;
  scramble_rush_attempts_pg?: number;
  goal_line_rush_attempts_pg?: number;
  rush_yards_per_attempt?: number;
  rush_td_rate?: number;

  route_participation?: number;
  routes_pg?: number;
  targets_per_route?: number;
  first_read_target_share?: number;
  air_yards_per_target?: number;
  end_zone_targets_pg?: number;
  red_zone_target_share?: number;
  catch_rate?: number;
  yards_per_target?: number;
  receiving_td_rate?: number;

  carries_pg?: number;
  inside_10_carries_pg?: number;
  rush_td_opportunity?: number;
  receiving_role_strength?: number;
  targets_pg?: number;
  yards_per_carry?: number;
  yards_per_reception?: number;

  role_stability?: number;
  td_dependency?: number;
}

export interface LeagueContextInput {
  teams: number;
  starters: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX?: number;
  };
  flex_allocation?: {
    RB?: number;
    WR?: number;
    TE?: number;
  };
  replacement_buffer?: number;
}

export interface ReplacementBaseline {
  position: ScoringPosition;
  replacement_points: number;
  replacement_rank: number;
  sample_size: number;
}

export type ReplacementPointsOverride = Partial<Record<ScoringPosition, number>>;

export interface ScoredPlayerOutput {
  player_id: string;
  player_name: string;
  team: string;
  position: ScoringPosition;
  expected_points: number;
  replacement_points: number;
  vorp: number;
  floor: number;
  median: number;
  ceiling: number;
  confidence_band: ConfidenceBand;
  volatility_tag: VolatilityTag;
  fragility_tag: FragilityTag;
  role_notes: string[];
}

export interface WeeklyScoringRequest {
  players: PlayerOpportunityInput[];
  league_context: LeagueContextInput;
  comparison_pool?: PlayerOpportunityInput[];
  replacement_points_override?: ReplacementPointsOverride;
}

export interface RosScoringRequest {
  players: PlayerOpportunityInput[];
  league_context: LeagueContextInput;
  remaining_weeks: number;
  comparison_pool?: PlayerOpportunityInput[];
  replacement_points_override?: ReplacementPointsOverride;
}

export interface WeeklyScoringResponse {
  generated_at: string;
  players: ScoredPlayerOutput[];
}

export interface RosScoringResponse {
  generated_at: string;
  remaining_weeks: number;
  players: Array<ScoredPlayerOutput & { ros_expected_points: number; ros_vorp: number }>;
}
