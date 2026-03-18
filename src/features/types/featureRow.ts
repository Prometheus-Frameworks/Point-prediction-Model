export interface WrTeFeatureRow {
  feature_schema_version: 'wrte-weekly-v1';
  scenario_id: string;
  season: number;
  week: number;
  projection_label: string;
  projection_timestamp: string;
  player_id: string;
  player_name: string;
  player_position: 'WR' | 'TE';
  player_team: string;
  opponent_team: string;
  event_type: 'NONE' | 'PLAYER_TRADE' | 'TEAMMATE_INJURY' | 'PLAYER_SIGNING' | 'ROOKIE_ADDED';
  event_timestamp: string;

  usage_routes_pg_trailing3: number;
  usage_routes_pg_trailing5: number;
  usage_routes_pg_season: number;
  usage_targets_pg_trailing3: number;
  usage_targets_pg_trailing5: number;
  usage_targets_pg_season: number;
  usage_tprr_trailing3: number;
  usage_tprr_trailing5: number;
  usage_target_share_trailing3: number;
  usage_target_share_trailing5: number;
  usage_target_share_season: number;
  usage_air_yards_share_trailing3: number;
  usage_first_read_share_trailing3: number;
  usage_red_zone_target_share_trailing5: number;
  usage_end_zone_target_share_season: number;
  usage_snap_rate_trailing3: number;
  usage_route_stability_delta: number;

  efficiency_catch_rate_trailing3: number;
  efficiency_catch_rate_trailing5: number;
  efficiency_yards_per_target_trailing3: number;
  efficiency_yards_per_target_trailing5: number;
  efficiency_yards_per_route_run_trailing3: number;
  efficiency_yards_per_route_run_season: number;
  efficiency_td_per_target_trailing5: number;
  efficiency_adot_trailing3: number;
  efficiency_explosive_target_rate_trailing5: number;
  efficiency_fantasy_points_pg_trailing5: number;
  efficiency_fantasy_points_delta_vs_baseline: number;

  team_implied_points: number;
  team_play_volume_index: number;
  team_pass_rate_over_expected: number;
  team_neutral_pass_rate: number;
  team_qb_efficiency_index: number;
  team_pace_index: number;
  team_red_zone_pass_rate: number;
  team_target_competition_index: number;
  team_pass_block_grade: number;
  team_pressure_allowed_proxy: number;

  player_age: number;
  player_experience_years: number;
  player_is_rookie: number;
  player_recent_team_change: number;
  player_games_trailing3: number;
  player_games_trailing5: number;
  player_games_season: number;
  player_baseline_games: number;
  player_role_growth_trailing3_vs_season: number;
  player_efficiency_growth_trailing3_vs_baseline: number;
  player_usage_volatility_trailing5: number;
  player_sample_reliability: number;

  matchup_is_home: number;
  matchup_game_total: number;
  matchup_spread: number;
  matchup_defense_rank_vs_position: number;
  matchup_man_coverage_rate: number;
  matchup_zone_coverage_rate: number;
  matchup_pressure_rate: number;
  matchup_blitz_rate: number;
  matchup_explosive_pass_rate_allowed: number;
  matchup_red_zone_td_rate_allowed: number;
  matchup_slot_coverage_weakness: number;
  matchup_linebacker_coverage_weakness: number;

  event_weeks_since_event: number;
  event_severity: number;
  event_clarity: number;
  event_teammate_target_share_delta: number;
  event_depth_chart_delta: number;
  event_qb_change: number;
  event_history_count: number;
  event_has_recent_signal: number;
}

export type WrTeFeatureNumericKey = {
  [K in keyof WrTeFeatureRow]: WrTeFeatureRow[K] extends number ? K : never;
}[keyof WrTeFeatureRow];
