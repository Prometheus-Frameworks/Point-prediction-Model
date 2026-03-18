import type { TeamContext } from './team.js';

export type ProjectionEventType = 'PLAYER_TRADE';

export interface ProjectionEvent {
  type: ProjectionEventType;
  description: string;
  fromTeam: TeamContext;
  toTeam: TeamContext;
  effectiveWeek: number;
}
