import type { ConfidenceBand, FragilityTag, RosScoringRequest, ScoringPosition, VolatilityTag, WeeklyScoringRequest } from './scoring.js';

export interface TiberScoringMetadata {
  generated_at: string;
  scoring_mode: 'weekly' | 'ros';
  view_type: 'player_card' | 'rankings';
}

export interface TiberScoringComponents {
  expected_points: number;
  replacement_points: number;
  vorp: number;
  floor: number;
  median: number;
  ceiling: number;
}

export interface TiberWeeklyPlayerCard {
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
  weekly_outlook: string;
  role_summary: string;
  value_summary: string;
  role_notes: string[];
  scoring_components: TiberScoringComponents;
  generated_at: string;
  scoring_mode: 'weekly';
  view_type: 'player_card';
}

export interface TiberWeeklyRankingsRow {
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
  value_summary: string;
}

export interface TiberWeeklyRankingsView {
  generated_at: string;
  scoring_mode: 'weekly';
  view_type: 'rankings';
  rows: TiberWeeklyRankingsRow[];
}

export interface TiberRosPlayerCard {
  player_id: string;
  player_name: string;
  team: string;
  position: ScoringPosition;
  expected_points: number;
  vorp: number;
  ros_expected_points: number;
  ros_vorp: number;
  floor: number;
  median: number;
  ceiling: number;
  confidence_band: ConfidenceBand;
  volatility_tag: VolatilityTag;
  fragility_tag: FragilityTag;
  weekly_outlook: string;
  role_summary: string;
  value_summary: string;
  ros_summary: string;
  role_notes: string[];
  generated_at: string;
  scoring_mode: 'ros';
  view_type: 'player_card';
}

export interface BuildWeeklyPlayerCardOutput {
  card: TiberWeeklyPlayerCard;
}

export interface BuildWeeklyRankingsViewOutput {
  view: TiberWeeklyRankingsView;
}

export interface BuildRosPlayerCardOutput {
  card: TiberRosPlayerCard;
  remaining_weeks: number;
}

export type BuildWeeklyPlayerCardRequest = WeeklyScoringRequest;
export type BuildWeeklyRankingsViewRequest = WeeklyScoringRequest;
export type BuildRosPlayerCardRequest = RosScoringRequest;
