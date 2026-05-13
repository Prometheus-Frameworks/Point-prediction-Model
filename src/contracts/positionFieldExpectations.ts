import type { PlayerOpportunityInput, ScoringPosition } from './scoring.js';

export type TiberDataOptionalPlayerOpportunityField = keyof Pick<
  PlayerOpportunityInput,
  | 'week'
  | 'season'
  | 'injury_risk'
  | 'pass_attempts_pg'
  | 'pass_yards_per_attempt'
  | 'pass_td_rate'
  | 'interception_rate'
  | 'rush_attempts_pg'
  | 'designed_rush_attempts_pg'
  | 'scramble_rush_attempts_pg'
  | 'goal_line_rush_attempts_pg'
  | 'rush_yards_per_attempt'
  | 'rush_td_rate'
  | 'route_participation'
  | 'routes_pg'
  | 'targets_per_route'
  | 'first_read_target_share'
  | 'air_yards_per_target'
  | 'end_zone_targets_pg'
  | 'red_zone_target_share'
  | 'catch_rate'
  | 'yards_per_target'
  | 'receiving_td_rate'
  | 'carries_pg'
  | 'inside_10_carries_pg'
  | 'rush_td_opportunity'
  | 'receiving_role_strength'
  | 'targets_pg'
  | 'yards_per_carry'
  | 'yards_per_reception'
  | 'role_stability'
  | 'td_dependency'
>;

const commonOptionalFields = ['week', 'season', 'role_stability', 'td_dependency', 'injury_risk'] as const satisfies readonly TiberDataOptionalPlayerOpportunityField[];

export const tiberDataPositionOptionalFieldExpectations = {
  QB: [
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
    ...commonOptionalFields,
  ],
  RB: [
    'carries_pg',
    'inside_10_carries_pg',
    'rush_td_opportunity',
    'receiving_role_strength',
    'targets_pg',
    'yards_per_carry',
    'yards_per_reception',
    'route_participation',
    'targets_per_route',
    ...commonOptionalFields,
  ],
  WR: [
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
    ...commonOptionalFields,
  ],
  TE: [
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
    ...commonOptionalFields,
  ],
} as const satisfies Record<ScoringPosition, readonly TiberDataOptionalPlayerOpportunityField[]>;

const tiberDataPositionOptionalFieldExpectationSets: Record<ScoringPosition, ReadonlySet<TiberDataOptionalPlayerOpportunityField>> = {
  QB: new Set(tiberDataPositionOptionalFieldExpectations.QB),
  RB: new Set(tiberDataPositionOptionalFieldExpectations.RB),
  WR: new Set(tiberDataPositionOptionalFieldExpectations.WR),
  TE: new Set(tiberDataPositionOptionalFieldExpectations.TE),
};

export const getTiberDataOptionalFieldsForPosition = (
  position: ScoringPosition,
): readonly TiberDataOptionalPlayerOpportunityField[] => tiberDataPositionOptionalFieldExpectations[position];

export const isTiberDataOptionalFieldRelevantForPosition = (
  position: ScoringPosition,
  field: string,
): field is TiberDataOptionalPlayerOpportunityField =>
  tiberDataPositionOptionalFieldExpectationSets[position].has(field as TiberDataOptionalPlayerOpportunityField);
