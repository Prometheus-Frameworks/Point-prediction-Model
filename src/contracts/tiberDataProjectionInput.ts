import type { LeagueContextInput, PlayerOpportunityInput, ReplacementPointsOverride, ScoringPosition, WeeklyScoringRequest } from './scoring.js';
import type { ServiceWarning } from '../services/result.js';

export const TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION = 'tiber-data-projection-input-v1' as const;

export interface TiberDataSourceDatasetRef {
  dataset_id: string;
  version: string;
  uri?: string;
}

export interface TiberDataIdentityRef {
  identity_artifact_id: string;
  version: string;
  uri?: string;
}

export type TiberDataProjectionFieldSeverity = 'required' | 'optional';

export interface TiberDataProjectionMissingField {
  field: string;
  severity: TiberDataProjectionFieldSeverity;
  reason: string;
  player_id?: string;
  impact?: string;
}

export type TiberDataPlayerOpportunityProjection = PlayerOpportunityInput;

export interface TiberDataProjectionInputBundle {
  input_contract_version: typeof TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION | string;
  tiber_data_schema_version: string;
  source_dataset_refs: TiberDataSourceDatasetRef[];
  identity_ref: TiberDataIdentityRef;
  projection_context?: Record<string, unknown>;
  player_opportunities: TiberDataPlayerOpportunityProjection[];
  league_context: LeagueContextInput;
  comparison_pool?: TiberDataPlayerOpportunityProjection[];
  replacement_points_override?: ReplacementPointsOverride;
  missing_fields?: TiberDataProjectionMissingField[];
  adapter_warnings?: ServiceWarning[];
}

export interface TiberDataProjectionFieldCoverage {
  required_fields_present: number;
  required_fields_missing: number;
  optional_fields_present: number;
  optional_fields_missing: number;
}

export interface TiberDataProjectionCoverageReport {
  input_contract_version: string;
  tiber_data_schema_version: string;
  source_dataset_refs: TiberDataSourceDatasetRef[];
  identity_ref: TiberDataIdentityRef;
  player_count: number;
  comparison_pool_count: number;
  mapped_required_fields: string[];
  mapped_optional_fields: string[];
  missing_fields: TiberDataProjectionMissingField[];
  coverage: TiberDataProjectionFieldCoverage;
  warnings: ServiceWarning[];
}

export interface TiberDataWeeklyScoringAdapterOutput {
  request: WeeklyScoringRequest;
  report: TiberDataProjectionCoverageReport;
}

export const tiberDataRequiredPlayerOpportunityFields = [
  'player_id',
  'player_name',
  'team',
  'position',
  'games_sampled',
] as const satisfies readonly (keyof PlayerOpportunityInput)[];

export const tiberDataOptionalPlayerOpportunityFields = [
  'week',
  'season',
  'injury_risk',
  'pass_attempts_pg',
  'pass_yards_per_attempt',
  'pass_td_rate',
  'interception_rate',
  'rush_attempts_pg',
  'designed_rush_attempts_pg',
  'scramble_rush_attempts_pg',
  'goal_line_rush_attempts_pg',
  'rush_yards_per_attempt',
  'rush_td_rate',
  'route_participation',
  'routes_pg',
  'targets_per_route',
  'first_read_target_share',
  'air_yards_per_target',
  'end_zone_targets_pg',
  'red_zone_target_share',
  'catch_rate',
  'yards_per_target',
  'receiving_td_rate',
  'carries_pg',
  'inside_10_carries_pg',
  'rush_td_opportunity',
  'receiving_role_strength',
  'targets_pg',
  'yards_per_carry',
  'yards_per_reception',
  'role_stability',
  'td_dependency',
] as const satisfies readonly (keyof PlayerOpportunityInput)[];

export const tiberDataScoringPositions = ['QB', 'RB', 'WR', 'TE'] as const satisfies readonly ScoringPosition[];
