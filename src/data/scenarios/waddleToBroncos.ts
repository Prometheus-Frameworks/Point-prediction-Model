import type { ProjectionEvent } from '../../types/event.js';
import type { PlayerProfile } from '../../types/player.js';
import type { TeamContext } from '../../types/team.js';

export const jaylenWaddle: PlayerProfile = {
  id: 'jaylen-waddle',
  name: 'Jaylen Waddle',
  position: 'WR',
  team: 'MIA',
  routesPerGame: 33,
  targetsPerRouteRun: 0.23,
  catchRate: 0.67,
  yardsPerTarget: 8.6,
  tdPerTarget: 0.065,
  rushPointsPerGame: 0.3,
};

export const dolphinsContext: TeamContext = {
  team: 'MIA',
  quarterback: 'Tua Tagovailoa',
  targetCompetitionIndex: 80,
  qbEfficiencyIndex: 108,
  passTdEnvironmentIndex: 112,
  playVolumeIndex: 101,
  passRateIndex: 104,
};

export const broncosContext: TeamContext = {
  team: 'DEN',
  quarterback: 'Bo Nix',
  targetCompetitionIndex: 72,
  qbEfficiencyIndex: 96,
  passTdEnvironmentIndex: 94,
  playVolumeIndex: 98,
  passRateIndex: 97,
};

export const waddleTradeEvent: ProjectionEvent = {
  type: 'PLAYER_TRADE',
  description: 'Jaylen Waddle is traded from the Dolphins to the Broncos.',
  fromTeam: dolphinsContext,
  toTeam: broncosContext,
  effectiveWeek: 1,
};
