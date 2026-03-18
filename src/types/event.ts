import type { TeamContext } from './team.js';

export type ProjectionEventType =
  | 'PLAYER_TRADE'
  | 'TEAMMATE_INJURY'
  | 'PLAYER_SIGNING'
  | 'ROOKIE_ADDED';

export interface ProjectionEvent {
  type: ProjectionEventType;
  description: string;
  effectiveWeek: number;
  fromTeam?: TeamContext;
  toTeam?: TeamContext;
  severity?: number;
  clarity?: number;
  materiallyChangedVariables?: Array<
    'routesPerGame' | 'targetsPerRouteRun' | 'catchRate' | 'yardsPerTarget' | 'tdPerTarget'
  >;
}
