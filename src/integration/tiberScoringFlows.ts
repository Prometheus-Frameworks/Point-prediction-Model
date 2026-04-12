import { createScoringServiceClient, type ScoringServiceClient } from './scoringServiceClient.js';
import { toLeagueContextInput, toScoringPlayerInput } from './scoringRequestMappers.js';
import type {
  ScoringServiceRosPlayerCard,
  ScoringServiceWeeklyPlayerCard,
  ScoringServiceWeeklyRankingsRow,
  TiberLeagueSettings,
  TiberPlayerSnapshot,
} from './scoringServiceTypes.js';

interface ScoringUnavailableState {
  available: false;
  message: string;
}

interface PlayerPageSuccess {
  available: true;
  weekly: ScoringServiceWeeklyPlayerCard;
  ros?: ScoringServiceRosPlayerCard;
}

export type PlayerPageScoringState = PlayerPageSuccess | ScoringUnavailableState;

export interface RankingsScoringState {
  available: boolean;
  message?: string;
  rows: ScoringServiceWeeklyRankingsRow[];
}

interface PlayerPageArgs {
  player: TiberPlayerSnapshot;
  league: TiberLeagueSettings;
  includeRos?: boolean;
  remainingWeeks?: number;
}

interface RankingsArgs {
  players: TiberPlayerSnapshot[];
  league: TiberLeagueSettings;
}

const toUnavailable = (message: string): ScoringUnavailableState => ({
  available: false,
  message,
});

export const loadWeeklyPlayerPageScoring = async (
  args: PlayerPageArgs,
  client: ScoringServiceClient = createScoringServiceClient(),
): Promise<PlayerPageScoringState> => {
  const request = {
    league_context: toLeagueContextInput(args.league),
    players: [toScoringPlayerInput(args.player)] as [ReturnType<typeof toScoringPlayerInput>],
  };

  const weekly = await client.getWeeklyPlayerCard(request);
  if (!weekly.ok) {
    console.warn('[scoring] weekly player card unavailable:', weekly.message);
    return toUnavailable('Scoring unavailable.');
  }

  if (!args.includeRos) {
    return { available: true, weekly: weekly.data };
  }

  const ros = await client.getRosPlayerCard({
    ...request,
    remaining_weeks: args.remainingWeeks ?? 8,
  });

  if (!ros.ok) {
    console.warn('[scoring] ros player card unavailable:', ros.message);
    return { available: true, weekly: weekly.data };
  }

  return { available: true, weekly: weekly.data, ros: ros.data };
};

export const loadWeeklyRankingsScoring = async (
  args: RankingsArgs,
  client: ScoringServiceClient = createScoringServiceClient(),
): Promise<RankingsScoringState> => {
  const result = await client.getWeeklyRankings({
    league_context: toLeagueContextInput(args.league),
    players: args.players.map(toScoringPlayerInput),
  });

  if (!result.ok) {
    console.warn('[scoring] weekly rankings unavailable:', result.message);
    return {
      available: false,
      rows: [],
      message: 'Scoring unavailable.',
    };
  }

  return {
    available: true,
    rows: result.data,
  };
};
