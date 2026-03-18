import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { clamp01, roundFeature, summarizeStdDev, usageGrowth } from './shared.js';

export const buildPlayerArcFeatures = (input: WrTeFeatureSourceInput): Pick<
  WrTeFeatureRow,
  | 'player_age'
  | 'player_experience_years'
  | 'player_is_rookie'
  | 'player_recent_team_change'
  | 'player_games_trailing3'
  | 'player_games_trailing5'
  | 'player_games_season'
  | 'player_baseline_games'
  | 'player_role_growth_trailing3_vs_season'
  | 'player_efficiency_growth_trailing3_vs_baseline'
  | 'player_usage_volatility_trailing5'
  | 'player_sample_reliability'
> => {
  const recentTeamChange = input.event.type === 'PLAYER_TRADE' || input.player.currentTeam !== (input.player.listedTeam ?? input.player.currentTeam);
  const sampleReliability = clamp01(
    (input.windows.seasonToDate.games * 0.07) +
      (input.windows.baseline.games * 0.02) +
      (input.player.experienceYears * 0.03) -
      (input.player.isRookie ? 0.15 : 0),
  );

  return {
    player_age: roundFeature(input.player.age),
    player_experience_years: roundFeature(input.player.experienceYears),
    player_is_rookie: input.player.isRookie ? 1 : 0,
    player_recent_team_change: recentTeamChange ? 1 : 0,
    player_games_trailing3: roundFeature(input.windows.trailing3.games),
    player_games_trailing5: roundFeature(input.windows.trailing5.games),
    player_games_season: roundFeature(input.windows.seasonToDate.games),
    player_baseline_games: roundFeature(input.windows.baseline.games),
    player_role_growth_trailing3_vs_season: usageGrowth(input.windows.trailing3, input.windows.seasonToDate, 'targetShare'),
    player_efficiency_growth_trailing3_vs_baseline: usageGrowth(input.windows.trailing3, input.windows.baseline, 'yardsPerRouteRun'),
    player_usage_volatility_trailing5: roundFeature(summarizeStdDev(input.priorGames.slice(-5).map((game) => game.targets))),
    player_sample_reliability: roundFeature(sampleReliability),
  };
};
