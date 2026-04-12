import type { LeagueContextInput, PlayerOpportunityInput } from '../contracts/scoring.js';
import type { TiberLeagueSettings, TiberPlayerSnapshot } from './scoringServiceTypes.js';

export const toLeagueContextInput = (league: TiberLeagueSettings): LeagueContextInput => ({
  teams: league.teams,
  starters: league.starters,
  replacement_buffer: league.replacementBuffer,
});

export const toScoringPlayerInput = (player: TiberPlayerSnapshot): PlayerOpportunityInput => {
  const sharedRisk = {
    role_stability: player.risk?.roleStability,
    td_dependency: player.risk?.tdDependency,
    injury_risk: player.risk?.injuryRisk,
  };

  if (player.position === 'QB') {
    return {
      player_id: player.id,
      player_name: player.name,
      team: player.team,
      position: player.position,
      games_sampled: player.gamesSampled,
      pass_attempts_pg: player.passing?.attemptsPerGame ?? 0,
      pass_yards_per_attempt: player.passing?.yardsPerAttempt ?? 0,
      pass_td_rate: player.passing?.tdRate ?? 0,
      interception_rate: player.passing?.interceptionRate ?? 0,
      rush_attempts_pg: player.rushing?.attemptsPerGame ?? 0,
      rush_yards_per_attempt: player.rushing?.yardsPerAttempt ?? 0,
      rush_td_rate: player.rushing?.tdRate ?? 0,
      ...sharedRisk,
    };
  }

  return {
    player_id: player.id,
    player_name: player.name,
    team: player.team,
    position: player.position,
    games_sampled: player.gamesSampled,
    routes_pg: player.receiving?.routesPerGame ?? 0,
    targets_per_route: player.receiving?.targetsPerRoute ?? 0,
    catch_rate: player.receiving?.catchRate ?? 0,
    yards_per_target: player.receiving?.yardsPerTarget ?? 0,
    receiving_td_rate: player.receiving?.tdRate ?? 0,
    ...sharedRisk,
  };
};
