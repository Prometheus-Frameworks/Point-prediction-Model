export type Position = 'WR' | 'TE';

export interface PlayerProfile {
  id: string;
  name: string;
  position: Position;
  team: string;
  sampleSizeGames: number;
  routesPerGame: number;
  targetsPerRouteRun: number;
  catchRate: number;
  yardsPerTarget: number;
  tdPerTarget: number;
  rushPointsPerGame?: number;
}
