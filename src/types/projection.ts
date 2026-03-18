import type { ProjectionEvent, ProjectionEventType } from './event.js';
import type { PlayerProfile } from './player.js';
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
  eventType?: ProjectionEventType;
  baseline: ProjectionBreakdown;
  adjusted: ProjectionBreakdown;
  delta: ProjectionBreakdown;
  deltaPprPointsPerGame: number;
  confidenceScore: number;
  confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string[];
}
