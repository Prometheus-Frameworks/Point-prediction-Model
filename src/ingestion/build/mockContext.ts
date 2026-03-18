import type { PlayerProfile } from '../../types/player.js';
import type { TeamContext } from '../../types/team.js';

const teamLookup: Record<string, TeamContext> = {
  MIA: {
    team: 'MIA',
    quarterback: 'Tua Tagovailoa',
    targetCompetitionIndex: 80,
    qbEfficiencyIndex: 108,
    passTdEnvironmentIndex: 112,
    playVolumeIndex: 101,
    passRateIndex: 104,
  },
  DEN: {
    team: 'DEN',
    quarterback: 'Bo Nix',
    targetCompetitionIndex: 72,
    qbEfficiencyIndex: 96,
    passTdEnvironmentIndex: 94,
    playVolumeIndex: 98,
    passRateIndex: 97,
  },
  LV: {
    team: 'LV',
    quarterback: 'Geno Smith',
    targetCompetitionIndex: 76,
    qbEfficiencyIndex: 98,
    passTdEnvironmentIndex: 95,
    playVolumeIndex: 99,
    passRateIndex: 96,
  },
  NYJ: {
    team: 'NYJ',
    quarterback: 'Justin Fields',
    targetCompetitionIndex: 74,
    qbEfficiencyIndex: 93,
    passTdEnvironmentIndex: 90,
    playVolumeIndex: 97,
    passRateIndex: 95,
  },
  LAC: {
    team: 'LAC',
    quarterback: 'Justin Herbert',
    targetCompetitionIndex: 68,
    qbEfficiencyIndex: 109,
    passTdEnvironmentIndex: 106,
    playVolumeIndex: 100,
    passRateIndex: 99,
  },
  DAL: {
    team: 'DAL',
    quarterback: 'Dak Prescott',
    targetCompetitionIndex: 77,
    qbEfficiencyIndex: 103,
    passTdEnvironmentIndex: 102,
    playVolumeIndex: 101,
    passRateIndex: 100,
  },
};

const playerLookup: Record<string, PlayerProfile> = {
  'jaylen waddle': {
    id: 'jaylen-waddle',
    name: 'Jaylen Waddle',
    position: 'WR',
    team: 'MIA',
    sampleSizeGames: 17,
    routesPerGame: 33,
    targetsPerRouteRun: 0.23,
    catchRate: 0.67,
    yardsPerTarget: 8.6,
    tdPerTarget: 0.065,
    rushPointsPerGame: 0.3,
  },
  'davante adams': {
    id: 'davante-adams',
    name: 'Davante Adams',
    position: 'WR',
    team: 'LV',
    sampleSizeGames: 17,
    routesPerGame: 34,
    targetsPerRouteRun: 0.27,
    catchRate: 0.63,
    yardsPerTarget: 8.9,
    tdPerTarget: 0.072,
    rushPointsPerGame: 0,
  },
  'garrett wilson': {
    id: 'garrett-wilson',
    name: 'Garrett Wilson',
    position: 'WR',
    team: 'NYJ',
    sampleSizeGames: 17,
    routesPerGame: 35,
    targetsPerRouteRun: 0.26,
    catchRate: 0.62,
    yardsPerTarget: 8.4,
    tdPerTarget: 0.058,
    rushPointsPerGame: 0.2,
  },
  'josh palmer': {
    id: 'josh-palmer',
    name: 'Josh Palmer',
    position: 'WR',
    team: 'LAC',
    sampleSizeGames: 15,
    routesPerGame: 31,
    targetsPerRouteRun: 0.19,
    catchRate: 0.65,
    yardsPerTarget: 7.8,
    tdPerTarget: 0.05,
    rushPointsPerGame: 0,
  },
  'jake ferguson': {
    id: 'jake-ferguson',
    name: 'Jake Ferguson',
    position: 'TE',
    team: 'DAL',
    sampleSizeGames: 17,
    routesPerGame: 30,
    targetsPerRouteRun: 0.22,
    catchRate: 0.71,
    yardsPerTarget: 7.6,
    tdPerTarget: 0.051,
    rushPointsPerGame: 0,
  },
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

export const getMockTeamContext = (team: string): TeamContext => {
  const teamContext = teamLookup[team];

  if (teamContext) {
    return { ...teamContext };
  }

  return {
    team,
    quarterback: `${team} Mock QB`,
    targetCompetitionIndex: 75,
    qbEfficiencyIndex: 98,
    passTdEnvironmentIndex: 98,
    playVolumeIndex: 99,
    passRateIndex: 99,
  };
};

export const getMockPlayerProfile = (
  name: string,
  team: string,
  position?: 'WR' | 'TE',
  playerId?: string,
): PlayerProfile => {
  const seeded = playerLookup[normalizeKey(name)];

  if (seeded) {
    return {
      ...seeded,
      id: playerId ?? seeded.id,
      team,
      position: position ?? seeded.position,
    };
  }

  return {
    id: playerId ?? normalizeKey(name).replace(/[^a-z0-9]+/g, '-'),
    name,
    team,
    position: position ?? 'WR',
    sampleSizeGames: 12,
    routesPerGame: position === 'TE' ? 26 : 30,
    targetsPerRouteRun: position === 'TE' ? 0.2 : 0.19,
    catchRate: 0.66,
    yardsPerTarget: position === 'TE' ? 7.5 : 8.1,
    tdPerTarget: 0.05,
    rushPointsPerGame: 0,
  };
};
