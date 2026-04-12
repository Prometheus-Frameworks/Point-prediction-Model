import type { ScoredPlayerOutput } from '../contracts/scoring.js';
import type { TiberRosPlayerCard, TiberScoringComponents, TiberWeeklyPlayerCard, TiberWeeklyRankingsRow } from '../contracts/tiberScoring.js';

const weeklyOutlookLabel = (expectedPoints: number, vorp: number): string => {
  if (expectedPoints >= 21 || vorp >= 9) return 'Elite weekly starter';
  if (expectedPoints >= 16 || vorp >= 5) return 'Strong start';
  if (expectedPoints >= 11 || vorp >= 2) return 'Flex-worthy';
  if (expectedPoints >= 8 || vorp >= -1) return 'Volatile dart throw';
  return 'Replacement-level';
};

const roleByPosition: Record<ScoredPlayerOutput['position'], string> = {
  QB: 'Pocket/rushing blend QB role',
  RB: 'Backfield volume role',
  WR: 'Route-driven receiving role',
  TE: 'Middle-field receiving role',
};

const roleSummary = (player: ScoredPlayerOutput): string => {
  const volatilityHint = player.volatility_tag === 'VOLATILE' ? ' with volatile week-to-week range' : '';
  return `${roleByPosition[player.position]}${volatilityHint}`;
};

const valueSummary = (player: ScoredPlayerOutput): string => {
  if (player.vorp >= 8 && player.confidence_band === 'HIGH') return 'Difference-maker with stable weekly edge.';
  if (player.vorp >= 4) return 'Above-replacement weekly value profile.';
  if (player.vorp >= 1) return 'Useful starter value with moderate upside.';
  if (player.vorp >= -1) return 'Near replacement; matchup-dependent value.';
  return 'Below replacement baseline in current setup.';
};

const rosSummary = (rosVorp: number, remainingWeeks: number): string => {
  if (rosVorp >= remainingWeeks * 5) return 'League-shaping rest-of-season asset.';
  if (rosVorp >= remainingWeeks * 2.5) return 'Strong rest-of-season starter profile.';
  if (rosVorp >= remainingWeeks) return 'Playable rest-of-season depth value.';
  return 'Low rest-of-season edge versus replacement.';
};

const buildScoringComponents = (player: ScoredPlayerOutput): TiberScoringComponents => ({
  expected_points: player.expected_points,
  replacement_points: player.replacement_points,
  vorp: player.vorp,
  floor: player.floor,
  median: player.median,
  ceiling: player.ceiling,
});

export const toTiberWeeklyPlayerCard = (player: ScoredPlayerOutput, generatedAt: string): TiberWeeklyPlayerCard => ({
  player_id: player.player_id,
  player_name: player.player_name,
  team: player.team,
  position: player.position,
  expected_points: player.expected_points,
  replacement_points: player.replacement_points,
  vorp: player.vorp,
  floor: player.floor,
  median: player.median,
  ceiling: player.ceiling,
  confidence_band: player.confidence_band,
  volatility_tag: player.volatility_tag,
  fragility_tag: player.fragility_tag,
  weekly_outlook: weeklyOutlookLabel(player.expected_points, player.vorp),
  role_summary: roleSummary(player),
  value_summary: valueSummary(player),
  role_notes: player.role_notes,
  scoring_components: buildScoringComponents(player),
  generated_at: generatedAt,
  scoring_mode: 'weekly',
  view_type: 'player_card',
});

export const toTiberWeeklyRankingsRow = (player: ScoredPlayerOutput, rank: number): TiberWeeklyRankingsRow => ({
  rank,
  player_id: player.player_id,
  player_name: player.player_name,
  team: player.team,
  position: player.position,
  expected_points: player.expected_points,
  vorp: player.vorp,
  floor: player.floor,
  ceiling: player.ceiling,
  confidence_band: player.confidence_band,
  weekly_outlook: weeklyOutlookLabel(player.expected_points, player.vorp),
  value_summary: valueSummary(player),
});

export const toTiberRosPlayerCard = (
  player: ScoredPlayerOutput & { ros_expected_points: number; ros_vorp: number },
  generatedAt: string,
  remainingWeeks: number,
): TiberRosPlayerCard => ({
  player_id: player.player_id,
  player_name: player.player_name,
  team: player.team,
  position: player.position,
  expected_points: player.expected_points,
  vorp: player.vorp,
  ros_expected_points: player.ros_expected_points,
  ros_vorp: player.ros_vorp,
  floor: player.floor,
  median: player.median,
  ceiling: player.ceiling,
  confidence_band: player.confidence_band,
  volatility_tag: player.volatility_tag,
  fragility_tag: player.fragility_tag,
  weekly_outlook: weeklyOutlookLabel(player.expected_points, player.vorp),
  role_summary: roleSummary(player),
  value_summary: valueSummary(player),
  ros_summary: rosSummary(player.ros_vorp, remainingWeeks),
  role_notes: player.role_notes,
  generated_at: generatedAt,
  scoring_mode: 'ros',
  view_type: 'player_card',
});
