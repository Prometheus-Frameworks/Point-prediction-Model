import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { clamp01, roundFeature } from './shared.js';

export const buildTeamContextFeatures = (input: WrTeFeatureSourceInput): Pick<
  WrTeFeatureRow,
  | 'team_implied_points'
  | 'team_play_volume_index'
  | 'team_pass_rate_over_expected'
  | 'team_neutral_pass_rate'
  | 'team_qb_efficiency_index'
  | 'team_pace_index'
  | 'team_red_zone_pass_rate'
  | 'team_target_competition_index'
  | 'team_pass_block_grade'
  | 'team_pressure_allowed_proxy'
> => ({
  team_implied_points: roundFeature(input.team.impliedPoints),
  team_play_volume_index: roundFeature(input.team.playVolumeIndex),
  team_pass_rate_over_expected: roundFeature(input.team.passRateOverExpected),
  team_neutral_pass_rate: roundFeature(input.team.neutralPassRate),
  team_qb_efficiency_index: roundFeature(input.team.qbEfficiencyIndex),
  team_pace_index: roundFeature(input.team.paceIndex),
  team_red_zone_pass_rate: roundFeature(input.team.redZonePassRate),
  team_target_competition_index: roundFeature(input.team.targetCompetitionIndex),
  team_pass_block_grade: roundFeature(input.team.passBlockGrade),
  team_pressure_allowed_proxy: roundFeature(clamp01((input.team.opponentPressureRate + (100 - input.team.passBlockGrade) / 100) / 2)),
});
