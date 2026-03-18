import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { getDefenseRankForPosition, roundFeature } from './shared.js';

export const buildMatchupFeatures = (input: WrTeFeatureSourceInput): Pick<
  WrTeFeatureRow,
  | 'matchup_is_home'
  | 'matchup_game_total'
  | 'matchup_spread'
  | 'matchup_defense_rank_vs_position'
  | 'matchup_man_coverage_rate'
  | 'matchup_zone_coverage_rate'
  | 'matchup_pressure_rate'
  | 'matchup_blitz_rate'
  | 'matchup_explosive_pass_rate_allowed'
  | 'matchup_red_zone_td_rate_allowed'
  | 'matchup_slot_coverage_weakness'
  | 'matchup_linebacker_coverage_weakness'
> => ({
  matchup_is_home: input.matchup.venue === 'HOME' ? 1 : 0,
  matchup_game_total: roundFeature(input.matchup.gameTotal),
  matchup_spread: roundFeature(input.matchup.spread),
  matchup_defense_rank_vs_position: getDefenseRankForPosition(input),
  matchup_man_coverage_rate: roundFeature(input.matchup.manCoverageRate),
  matchup_zone_coverage_rate: roundFeature(input.matchup.zoneCoverageRate),
  matchup_pressure_rate: roundFeature(input.matchup.pressureRate),
  matchup_blitz_rate: roundFeature(input.matchup.blitzRate),
  matchup_explosive_pass_rate_allowed: roundFeature(input.matchup.explosivePassRateAllowed),
  matchup_red_zone_td_rate_allowed: roundFeature(input.matchup.redZoneTdRateAllowed),
  matchup_slot_coverage_weakness: roundFeature(input.matchup.slotCoverageWeakness),
  matchup_linebacker_coverage_weakness: roundFeature(input.matchup.linebackerCoverageWeakness),
});
