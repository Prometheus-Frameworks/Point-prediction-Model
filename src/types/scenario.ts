import type { ProjectionEvent } from './event.js';
import type { PlayerProfile } from './player.js';
import type { TeamContext } from './team.js';

export interface ProjectionScenarioMetadata {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  defaultRun?: boolean;
}

export interface ProjectionScenario {
  metadata: ProjectionScenarioMetadata;
  player: PlayerProfile;
  previousTeamContext: TeamContext;
  newTeamContext: TeamContext;
  event: ProjectionEvent;
}
