import type { ProjectionScenario } from '../../types/scenario.js';
import { projectPlayer } from '../projection/projectPlayer.js';

export const runScenario = (scenario: ProjectionScenario) =>
  projectPlayer(
    scenario.player,
    scenario.previousTeamContext,
    scenario.newTeamContext,
    scenario.event,
  );
