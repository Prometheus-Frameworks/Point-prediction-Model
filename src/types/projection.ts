import type { PlayerProfile } from './player.js';
import type { ProjectionEvent } from './event.js';
import type { TeamContext } from './team.js';

export interface ProjectionBreakdown {
  targetsPerGame: number;
  receptionsPerGame: number;
  yardsPerGame: number;
  tdsPerGame: number;
  rushPointsPerGame: number;
  pprPointsPerGame: number;
}

export interface ProjectionOutput {
  player: PlayerProfile;
  priorTeam: TeamContext;
  currentTeam: TeamContext;
  event?: ProjectionEvent;
  baseline: ProjectionBreakdown;
  adjusted: ProjectionBreakdown;
  deltaPprPointsPerGame: number;
  explanation: string[];
}
